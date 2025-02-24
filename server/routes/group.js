const express = require('express');
const router = express.Router();
const { Group, GroupMember, GroupMessage, GroupMessageRead, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const { sendGroupMessage } = require('../websocket');

// 创建群组
router.post('/', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.headers['x-user-id'];
    const { name, description, members = [] } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    // 创建群组
    const group = await Group.create({
      name,
      description,
      owner_id: parseInt(userId)
    }, { transaction: t });

    // 创建者自动成为群主
    await GroupMember.create({
      group_id: group.id,
      user_id: parseInt(userId),
      role: 'owner'
    }, { transaction: t });

    // 批量添加成员
    if (members.length > 0) {
      await GroupMember.bulkCreate(
        members.map(memberId => ({
          group_id: group.id,
          user_id: memberId,
          role: 'member'
        })),
        { transaction: t }
      );
    }

    await t.commit();

    // 获取完整的群组信息
    const createdGroup = await Group.findOne({
      where: { id: group.id },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'nickname', 'avatar']
        },
        {
          model: GroupMember,
          as: 'members',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'nickname', 'avatar']
          }]
        }
      ]
    });

    res.json({
      success: true,
      message: '群组创建成功',
      data: createdGroup
    });
  } catch (error) {
    await t.rollback();
    console.error('创建群组失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取用户的群组列表
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const groups = await Group.findAll({
      include: [
        {
          model: GroupMember,
          as: 'members',
          where: { user_id: parseInt(userId) },
          required: true
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ]
    });

    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    console.error('获取群组列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取群组详情
router.get('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    // 检查用户是否是群成员
    const member = await GroupMember.findOne({
      where: {
        group_id: id,
        user_id: parseInt(userId)
      }
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: '您不是该群成员'
      });
    }

    const group = await Group.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'nickname', 'avatar']
        },
        {
          model: GroupMember,
          as: 'members',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'nickname', 'avatar']
          }]
        }
      ]
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: '群组不存在'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('获取群组详情失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取群消息历史
router.get('/:id/messages', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { id } = req.params;
    const { before } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    // 检查用户是否是群成员
    const member = await GroupMember.findOne({
      where: {
        group_id: id,
        user_id: parseInt(userId)
      }
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: '您不是该群成员'
      });
    }

    const where = { group_id: id };
    if (before) {
      where.create_time = { [Op.lt]: new Date(before) };
    }

    const messages = await GroupMessage.findAll({
      where,
      include: [{
        model: User,
        as: 'fromUser',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }],
      order: [['create_time', 'DESC']],
      limit: 50
    });

    res.json({
      success: true,
      data: messages.reverse()
    });
  } catch (error) {
    console.error('获取群消息历史失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 邀请用户加入群组
router.post('/:id/members', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { id } = req.params;
    const { userIds } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    // 检查当前用户是否是群主或管理员
    const member = await GroupMember.findOne({
      where: {
        group_id: id,
        user_id: parseInt(userId),
        role: { [Op.in]: ['owner', 'admin'] }
      }
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: '您没有权限邀请成员'
      });
    }

    // 批量创建群成员
    const members = await GroupMember.bulkCreate(
      userIds.map(uid => ({
        group_id: id,
        user_id: uid,
        role: 'member'
      })),
      { ignoreDuplicates: true }
    );

    res.json({
      success: true,
      message: '邀请成功',
      data: members
    });
  } catch (error) {
    console.error('邀请成员失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 退出群组
router.delete('/:id/members', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const member = await GroupMember.findOne({
      where: {
        group_id: id,
        user_id: parseInt(userId)
      }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: '您不是该群成员'
      });
    }

    if (member.role === 'owner') {
      return res.status(400).json({
        success: false,
        message: '群主不能退出群组'
      });
    }

    await member.destroy();

    res.json({
      success: true,
      message: '退出成功'
    });
  } catch (error) {
    console.error('退出群组失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 