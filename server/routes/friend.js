const express = require('express');
const router = express.Router();
const Friend = require('../models/friend');
const User = require('../models/user');
const { Op } = require('sequelize');
const { sendFriendRequestNotification, sendFriendshipUpdateNotification } = require('../websocket');

// 搜索用户
router.get('/search', async (req, res) => {
  try {
    const { username } = req.query;
    const userId = req.headers['x-user-id'];

    if (!username) {
      return res.status(400).json({
        success: false,
        message: '请输入用户名'
      });
    }

    const users = await User.findAll({
      where: {
        username: {
          [Op.like]: `%${username}%`
        },
        id: {
          [Op.ne]: parseInt(userId)
        }
      },
      attributes: ['id', 'username', 'nickname', 'avatar']
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('搜索用户失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 发送好友请求
router.post('/request', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { friendId } = req.body;

    // 检查是否已经是好友
    const existingFriend = await Friend.findOne({
      where: {
        [Op.or]: [
          { userId: parseInt(userId), friendId: friendId },
          { userId: friendId, friendId: parseInt(userId) }
        ]
      }
    });

    if (existingFriend) {
      return res.status(400).json({
        success: false,
        message: '已经发送过好友请求或已经是好友'
      });
    }

    // 创建好友请求
    await Friend.create({
      userId: parseInt(userId),
      friendId: friendId
    });

    // 获取发送请求的用户信息
    const fromUser = await User.findByPk(parseInt(userId), {
      attributes: ['id', 'username', 'nickname', 'avatar']
    });

    // 发送实时通知
    sendFriendRequestNotification(friendId, fromUser);

    res.json({
      success: true,
      message: '好友请求已发送，等待对方验证'
    });
  } catch (error) {
    console.error('发送好友请求失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 处理好友请求
router.put('/request/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.headers['x-user-id'];

    const request = await Friend.findOne({
      where: {
        id: id,
        friendId: parseInt(userId),
        status: 'pending'
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: '好友请求不存在'
      });
    }

    await request.update({ status });

    // 如果接受了好友请求，发送通知给双方
    if (status === 'accepted') {
      sendFriendshipUpdateNotification(request.userId, parseInt(userId), 'accepted');
      
      // 获取新好友的完整信息
      const newFriend = await User.findByPk(request.userId, {
        attributes: ['id', 'username', 'nickname', 'avatar']
      });

      res.json({
        success: true,
        message: '已接受好友请求',
        data: newFriend
      });
    } else {
      res.json({
        success: true,
        message: '已拒绝好友请求'
      });
    }
  } catch (error) {
    console.error('处理好友请求失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取好友列表
router.get('/list', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    const friends = await Friend.findAll({
      where: {
        [Op.or]: [
          { userId: parseInt(userId) },
          { friendId: parseInt(userId) }
        ],
        status: 'accepted'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname', 'avatar']
        },
        {
          model: User,
          as: 'friendInfo',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ]
    });

    // 处理好友列表数据，使用 Set 去重
    const friendSet = new Set();
    const friendList = friends.reduce((acc, friend) => {
      const isFriend = friend.userId === parseInt(userId);
      const friendData = isFriend ? friend.friendInfo : friend.user;
      
      // 如果这个好友还没有被添加过
      if (!friendSet.has(friendData.id)) {
        friendSet.add(friendData.id);
        acc.push({
          id: friendData.id,
          username: friendData.username,
          nickname: friend.nickname || friendData.nickname || friendData.username,
          avatar: friendData.avatar,
          remark: friend.nickname
        });
      }
      
      return acc;
    }, []);

    res.json({
      success: true,
      data: friendList
    });
  } catch (error) {
    console.error('获取好友列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取好友请求列表
router.get('/requests', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    const requests = await Friend.findAll({
      where: {
        friendId: parseInt(userId),
        status: 'pending'
      },
      include: [{
        model: User,
        as: 'requestUser',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }]
    });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('获取好友请求列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 修改好友备注
router.put('/nickname/:friendId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { friendId } = req.params;
    const { nickname } = req.body;

    const friend = await Friend.findOne({
      where: {
        [Op.or]: [
          { userId: parseInt(userId), friendId: parseInt(friendId) },
          { userId: parseInt(friendId), friendId: parseInt(userId) }
        ],
        status: 'accepted'
      }
    });

    if (!friend) {
      return res.status(404).json({
        success: false,
        message: '好友关系不存在'
      });
    }

    // 更新备注
    await friend.update({
      nickname: nickname,
      update_time: new Date()
    });

    res.json({
      success: true,
      message: '备注修改成功'
    });
  } catch (error) {
    console.error('修改好友备注失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 删除好友
router.delete('/:friendId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { friendId } = req.params;

    const friend = await Friend.findOne({
      where: {
        [Op.or]: [
          { userId: parseInt(userId), friendId: parseInt(friendId) },
          { userId: parseInt(friendId), friendId: parseInt(userId) }
        ],
        status: 'accepted'
      }
    });

    if (!friend) {
      return res.status(404).json({
        success: false,
        message: '好友关系不存在'
      });
    }

    // 删除好友关系
    await friend.destroy();

    // 通知被删除的好友
    sendFriendshipUpdateNotification(parseInt(friendId), parseInt(userId), 'deleted');

    res.json({
      success: true,
      message: '好友删除成功'
    });
  } catch (error) {
    console.error('删除好友失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 