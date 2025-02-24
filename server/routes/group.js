const express = require('express');
const router = express.Router();
const { Group, GroupMember, GroupMessage, GroupMessageRead, User, GroupRequest } = require('../models');
const { Op, literal } = require('sequelize');
const { sequelize } = require('../config/db');
const { sendGroupMessage, sendGroupRequestNotification, clients } = require('../websocket');
const multer = require('multer');
const { minioClient, bucket } = require('../config/minio');
const path = require('path');

// 生成随机群号
function generateGroupNumber() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// 配置 multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/png" || file.mimetype === "image/jpeg") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('只允许上传 .png 和 .jpg 格式的图片！'));
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024 // 限制2MB
  }
});

// 搜索群组 - 移到最前面
router.get('/search', async (req, res) => {
  try {
    const { groupNumber } = req.query;
    if (!groupNumber) {
      return res.status(400).json({
        success: false,
        message: '请提供群号'
      });
    }

    const group = await Group.findOne({
      where: { group_number: groupNumber },
      attributes: ['id', 'name', 'description', 'avatar', 'group_number', 'owner_id'],
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }]
    });

    if (!group) {
      return res.json({
        success: false,
        message: '未找到该群组'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('搜索群组失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取群组申请列表 - 移到第二位
router.get('/requests', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    console.log('获取群组申请列表 - 用户ID:', userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    // 获取用户管理的群组ID列表
    const managedGroups = await GroupMember.findAll({
      where: {
        user_id: parseInt(userId),
        role: {
          [Op.in]: ['owner', 'admin']
        }
      },
      include: [{
        model: Group,
        as: 'group',
        attributes: ['id', 'name', 'group_number']
      }]
    });

    console.log('用户管理的群组:', managedGroups);

    const groupIds = managedGroups.map(g => g.group_id);
    console.log('群组ID列表:', groupIds);

    // 如果用户没有管理的群组，直接返回空列表
    if (groupIds.length === 0) {
      console.log('用户没有管理的群组');
      return res.json({
        success: true,
        data: []
      });
    }

    // 获取这些群组的待处理申请
    const requests = await GroupRequest.findAll({
      where: {
        group_id: {
          [Op.in]: groupIds
        },
        status: 'pending'
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }, {
        model: Group,
        as: 'group',
        attributes: ['id', 'name', 'group_number']
      }],
      order: [['create_time', 'DESC']]
    });

    console.log('找到的申请:', requests);

    res.json({
      success: true,
      data: requests || []
    });
  } catch (error) {
    console.error('获取群组申请列表失败:', error);
    // 添加更详细的错误信息
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 创建群组
router.post('/', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.headers['x-user-id'];
    const { name, description, memberIds, groupNumber } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    // 验证群号是否已存在
    if (groupNumber) {
      const existingGroup = await Group.findOne({
        where: { group_number: groupNumber }
      });
      if (existingGroup) {
        return res.status(400).json({
          success: false,
          message: '群号已存在'
        });
      }
    }

    // 生成或使用指定的群号
    const finalGroupNumber = groupNumber || await (async function getUniqueNumber() {
      let number;
      let exists;
      do {
        number = generateGroupNumber();
        exists = await Group.findOne({ where: { group_number: number }});
      } while (exists);
      return number;
    })();

    // 创建群组
    const group = await Group.create({
      name,
      description,
      owner_id: parseInt(userId),
      group_number: finalGroupNumber
    }, { transaction: t });

    // 添加群主为成员
    await GroupMember.create({
      group_id: group.id,
      user_id: parseInt(userId),
      role: 'owner'
    }, { transaction: t });

    // 添加其他成员
    if (memberIds && memberIds.length > 0) {
      await GroupMember.bulkCreate(
        memberIds.map(memberId => ({
          group_id: group.id,
          user_id: parseInt(memberId),
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

// 获取群组列表
router.get('/list', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    // 获取用户所在的群组
    const groups = await Group.findAll({
      include: [
        {
          model: GroupMember,
          as: 'members',
          where: { user_id: parseInt(userId) },
          attributes: ['role']
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ]
    });

    // 获取每个群组的未读消息数
    const groupsWithUnread = await Promise.all(groups.map(async (group) => {
      const groupData = group.toJSON();
      
      // 获取用户在该群的最后读取时间
      const readRecord = await GroupMessageRead.findOne({
        where: {
          group_id: group.id,
          user_id: parseInt(userId)
        }
      });

      const lastReadTime = readRecord?.last_read_time || new Date(0);

      // 获取未读消息数
      const unreadCount = await GroupMessage.count({
        where: {
          group_id: group.id,
          create_time: {
            [Op.gt]: lastReadTime
          },
          from_user_id: {
            [Op.ne]: parseInt(userId) // 不计算自己发的消息
          }
        }
      });

      return {
        ...groupData,
        role: groupData.members[0].role,
        unreadCount
      };
    }));

    res.json({
      success: true,
      data: groupsWithUnread
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

// 更新群组信息
router.put('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.headers['x-user-id'];
    const { name, description, announcement, avatar } = req.body;

    // 检查权限
    const member = await GroupMember.findOne({
      where: {
        group_id: parseInt(groupId),
        user_id: parseInt(userId),
        role: {
          [Op.in]: ['owner', 'admin']
        }
      }
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: '没有权限修改群组信息'
      });
    }

    // 更新群组信息
    await Group.update({
      name: name,
      description: description,
      announcement: announcement,
      avatar: avatar,
      update_time: new Date()
    }, {
      where: { id: parseInt(groupId) }
    });

    res.json({
      success: true,
      message: '群组信息更新成功'
    });
  } catch (error) {
    console.error('更新群组信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 邀请成员
router.post('/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.headers['x-user-id'];
    const { memberIds } = req.body;

    // 检查权限
    const member = await GroupMember.findOne({
      where: {
        group_id: parseInt(groupId),
        user_id: parseInt(userId),
        role: {
          [Op.in]: ['owner', 'admin']
        }
      }
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: '没有权限邀请成员'
      });
    }

    // 过滤掉已经在群组中的成员
    const existingMembers = await GroupMember.findAll({
      where: {
        group_id: parseInt(groupId),
        user_id: {
          [Op.in]: memberIds
        }
      }
    });

    const existingMemberIds = existingMembers.map(m => m.user_id);
    const newMemberIds = memberIds.filter(id => !existingMemberIds.includes(id));

    // 添加新成员
    if (newMemberIds.length > 0) {
      await Promise.all(newMemberIds.map(memberId =>
        GroupMember.create({
          group_id: parseInt(groupId),
          user_id: parseInt(memberId),
          role: 'member'
        })
      ));
    }

    res.json({
      success: true,
      message: '成员添加成功'
    });
  } catch (error) {
    console.error('邀请成员失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 移除成员
router.delete('/:groupId/members/:memberId', async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.headers['x-user-id'];

    // 检查权限
    const operator = await GroupMember.findOne({
      where: {
        group_id: parseInt(groupId),
        user_id: parseInt(userId),
        role: {
          [Op.in]: ['owner', 'admin']
        }
      }
    });

    if (!operator) {
      return res.status(403).json({
        success: false,
        message: '没有权限移除成员'
      });
    }

    // 不能移除群主
    const targetMember = await GroupMember.findOne({
      where: {
        group_id: parseInt(groupId),
        user_id: parseInt(memberId)
      }
    });

    if (targetMember.role === 'owner') {
      return res.status(403).json({
        success: false,
        message: '不能移除群主'
      });
    }

    // 管理员不能移除其他管理员
    if (operator.role === 'admin' && targetMember.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: '管理员不能移除其他管理员'
      });
    }

    // 移除成员
    await GroupMember.destroy({
      where: {
        group_id: parseInt(groupId),
        user_id: parseInt(memberId)
      }
    });

    res.json({
      success: true,
      message: '成员移除成功'
    });
  } catch (error) {
    console.error('移除成员失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 设置管理员
router.put('/:groupId/members/:memberId/role', async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.headers['x-user-id'];
    const { role } = req.body;

    // 只有群主可以设置管理员
    const operator = await GroupMember.findOne({
      where: {
        group_id: parseInt(groupId),
        user_id: parseInt(userId),
        role: 'owner'
      }
    });

    if (!operator) {
      return res.status(403).json({
        success: false,
        message: '只有群主可以设置管理员'
      });
    }

    // 更新成员角色
    await GroupMember.update({
      role: role
    }, {
      where: {
        group_id: parseInt(groupId),
        user_id: parseInt(memberId)
      }
    });

    res.json({
      success: true,
      message: '角色设置成功'
    });
  } catch (error) {
    console.error('设置管理员失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 申请加入群组
router.post('/:groupId/join', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { groupId } = req.params;

    console.log('收到加入群组请求:', { userId, groupId });

    if (!userId || !groupId) {
      return res.status(400).json({
        success: false,
        message: '参数不完整'
      });
    }

    // 检查群组是否存在
    const group = await Group.findByPk(parseInt(groupId));
    if (!group) {
      console.log('群组不存在:', groupId);
      return res.status(404).json({
        success: false,
        message: '群组不存在'
      });
    }

    // 检查是否已经是群成员
    const isMember = await GroupMember.findOne({
      where: {
        group_id: parseInt(groupId),
        user_id: parseInt(userId)
      }
    });

    if (isMember) {
      console.log('用户已是群成员:', { userId, groupId });
      return res.status(400).json({
        success: false,
        message: '您已经是该群成员'
      });
    }

    // 检查是否已经有待处理的申请
    const existingRequest = await GroupRequest.findOne({
      where: {
        group_id: parseInt(groupId),
        user_id: parseInt(userId),
        status: 'pending'
      }
    });

    if (existingRequest) {
      console.log('已存在待处理的申请:', { userId, groupId });
      return res.status(400).json({
        success: false,
        message: '您已经申请过该群组，请等待审核'
      });
    }

    // 创建加群申请
    const request = await GroupRequest.create({
      group_id: parseInt(groupId),
      user_id: parseInt(userId),
      status: 'pending',
      create_time: new Date()
    });

    console.log('创建群组申请成功:', request.toJSON());

    // 获取申请人信息
    const user = await User.findByPk(parseInt(userId), {
      attributes: ['id', 'username', 'nickname', 'avatar']
    });

    if (!user) {
      console.log('未找到用户信息:', userId);
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 发送实时通知
    try {
      await sendGroupRequestNotification(parseInt(groupId), {
        ...user.toJSON(),
        requestId: request.id
      });
      console.log('发送群组申请通知成功');
    } catch (error) {
      console.error('发送群组申请通知失败:', error);
      // 通知发送失败不影响申请创建
    }

    res.json({
      success: true,
      message: '申请已发送，请等待管理员审核'
    });
  } catch (error) {
    console.error('申请加入群组失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

// 处理群组申请
router.put('/requests/:requestId', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.headers['x-user-id'];
    const { requestId } = req.params;
    const { action } = req.body;

    console.log('处理群组申请:', { requestId, action, userId });

    if (!['accepted', 'rejected'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: '无效的操作'
      });
    }

    const request = await GroupRequest.findOne({
      where: { id: requestId, status: 'pending' },
      include: [
        {
          model: Group,
          as: 'group'
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ]
    });

    if (!request) {
      console.log('申请不存在或已处理:', requestId);
      return res.status(404).json({
        success: false,
        message: '申请不存在或已处理'
      });
    }

    // 检查处理人是否有权限
    const memberRole = await GroupMember.findOne({
      where: {
        group_id: request.group_id,
        user_id: parseInt(userId),
        role: {
          [Op.in]: ['owner', 'admin']
        }
      }
    });

    if (!memberRole) {
      console.log('用户无权处理申请:', { userId, groupId: request.group_id });
      return res.status(403).json({
        success: false,
        message: '您没有权限处理该申请'
      });
    }

    // 检查申请人是否已经是群成员
    const existingMember = await GroupMember.findOne({
      where: {
        group_id: request.group_id,
        user_id: request.user_id
      }
    });

    if (existingMember) {
      console.log('用户已是群成员:', { userId: request.user_id, groupId: request.group_id });
      await request.update({ status: 'rejected' }, { transaction: t });
      await t.commit();
      return res.status(400).json({
        success: false,
        message: '该用户已经是群成员'
      });
    }

    // 更新申请状态
    await request.update({ status: action }, { transaction: t });
    console.log('申请状态已更新:', { requestId, status: action });

    // 如果同意申请，添加为群成员
    if (action === 'accepted') {
      const newMember = await GroupMember.create({
        group_id: request.group_id,
        user_id: request.user_id,
        role: 'member',
        join_time: new Date()
      }, { transaction: t });

      console.log('新成员已添加:', newMember.toJSON());

      // 发送系统消息到群聊
      const systemMessage = await GroupMessage.create({
        group_id: request.group_id,
        from_user_id: userId,
        type: 'system',
        content: `欢迎 ${request.user.nickname || request.user.username} 加入群组！`,
        metadata: {
          type: 'member_join',
          userId: request.user_id
        }
      }, { transaction: t });

      console.log('系统消息已创建:', systemMessage.toJSON());
    }

    await t.commit();
    console.log('事务已提交');

    // 发送WebSocket通知给申请人
    const notification = {
      type: 'group_request_update',
      data: {
        requestId: request.id,
        groupId: request.group_id,
        status: action,
        group: {
          id: request.group.id,
          name: request.group.name
        }
      }
    };

    const userSocket = clients.get(parseInt(request.user_id));
    if (userSocket) {
      userSocket.send(JSON.stringify(notification));
      console.log('已发送WebSocket通知给申请人');
    }

    // 如果同意申请，广播欢迎消息
    if (action === 'accepted') {
      await sendGroupMessage(request.group_id, {
        type: 'system',
        content: `欢迎 ${request.user.nickname || request.user.username} 加入群组！`,
        fromUser: {
          id: userId,
          username: 'System',
          nickname: 'System'
        },
        create_time: new Date().toISOString()
      });
      console.log('已广播欢迎消息');
    }

    res.json({
      success: true,
      message: action === 'accepted' ? '已同意申请' : '已拒绝申请'
    });
  } catch (error) {
    await t.rollback();
    console.error('处理群组申请失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

// 上传群头像
router.post('/:id/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    // 检查是否是群主或管理员
    const member = await GroupMember.findOne({
      where: {
        group_id: id,
        user_id: parseInt(userId),
        role: {
          [Op.in]: ['owner', 'admin']
        }
      }
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: '无权限修改群头像'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的图片'
      });
    }

    // 生成文件名
    const ext = path.extname(req.file.originalname);
    const filename = `groups/${id}_${Date.now()}${ext}`;

    // 上传到MinIO
    await minioClient.putObject(bucket, filename, req.file.buffer);

    // 生成访问URL
    const avatarUrl = `http://113.45.161.48:9000/${bucket}/${filename}`;

    // 更新群头像
    await Group.update({
      avatar: avatarUrl,
      update_time: new Date()
    }, {
      where: { id }
    });

    res.json({
      success: true,
      data: {
        avatar: avatarUrl
      }
    });
  } catch (error) {
    console.error('上传群头像失败:', error);
    res.status(500).json({
      success: false,
      message: '上传群头像失败'
    });
  }
});

// 获取未读消息数
router.get('/unread', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    // 获取用户所在的所有群组
    const userGroups = await GroupMember.findAll({
      where: { user_id: userId },
      attributes: ['group_id']
    });

    const groupIds = userGroups.map(group => group.group_id);

    // 获取每个群组的未读消息数
    const unreadCounts = await Promise.all(
      groupIds.map(async (groupId) => {
        const readRecord = await GroupMessageRead.findOne({
          where: {
            group_id: groupId,
            user_id: userId
          }
        });

        const lastReadTime = readRecord ? readRecord.last_read_time : new Date(0);

        const count = await GroupMessage.count({
          where: {
            group_id: groupId,
            create_time: {
              [Op.gt]: lastReadTime
            },
            from_user_id: {
              [Op.ne]: userId
            }
          }
        });

        return {
          groupId,
          count
        };
      })
    );

    res.json({
      success: true,
      data: unreadCounts
    });
  } catch (error) {
    console.error('获取未读消息数失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新群消息已读状态
router.put('/:groupId/read', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { groupId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    // 检查用户是否是群成员
    const member = await GroupMember.findOne({
      where: {
        group_id: parseInt(groupId),
        user_id: parseInt(userId)
      }
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: '不是群成员'
      });
    }

    // 更新或创建已读记录
    await GroupMessageRead.upsert({
      group_id: parseInt(groupId),
      user_id: parseInt(userId),
      last_read_time: new Date()
    });

    res.json({
      success: true,
      message: '已更新已读状态'
    });
  } catch (error) {
    console.error('更新群消息已读状态失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新群公告
router.put('/:groupId/announcement', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.headers['x-user-id'];
    const { announcement } = req.body;

    // 检查权限
    const member = await GroupMember.findOne({
      where: {
        group_id: parseInt(groupId),
        user_id: parseInt(userId),
        role: 'owner'  // 只允许群主修改公告
      }
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: '只有群主可以修改群公告'
      });
    }

    // 更新群公告
    await Group.update({
      announcement,
      update_time: new Date()
    }, {
      where: { id: parseInt(groupId) }
    });

    // 发送系统消息通知群成员
    const systemMessage = await GroupMessage.create({
      group_id: parseInt(groupId),
      from_user_id: parseInt(userId),
      type: 'system',
      content: '群公告已更新',
      metadata: {
        type: 'announcement_update',
        announcement
      }
    });

    // 通过WebSocket广播消息
    await sendGroupMessage(parseInt(groupId), {
      type: 'system',
      content: '群公告已更新',
      fromUser: {
        id: parseInt(userId),
        username: 'System',
        nickname: 'System'
      },
      metadata: {
        type: 'announcement_update',
        announcement
      },
      create_time: new Date().toISOString()
    });

    res.json({
      success: true,
      message: '群公告更新成功'
    });
  } catch (error) {
    console.error('更新群公告失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 