const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const { Op } = require('sequelize');
const sequelize = require('sequelize');
const multer = require('multer');
const { minioClient, bucket } = require('../config/minio');
const path = require('path');

// 配置multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制10MB
  }
});

// 上传媒体文件
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有接收到文件'
      });
    }

    const file = req.file;
    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}${fileExt}`;
    const fileType = file.mimetype.startsWith('image/') ? 'image' : 'file';
    const filePath = `${fileType}s/${fileName}`;

    // 上传到MinIO
    await minioClient.putObject(bucket, filePath, file.buffer);

    // 生成访问URL
    const fileUrl = `http://113.45.161.48:9000/${bucket}/${filePath}`;

    res.json({
      success: true,
      data: {
        url: fileUrl,
        type: fileType,
        name: file.originalname,
        size: file.size
      }
    });
  } catch (error) {
    console.error('上传文件失败:', error);
    res.status(500).json({
      success: false,
      message: '上传文件失败'
    });
  }
});

// 获取与指定用户的聊天记录
router.get('/history/:friendId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { friendId } = req.params;

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          {
            fromUserId: parseInt(userId),
            toUserId: parseInt(friendId)
          },
          {
            fromUserId: parseInt(friendId),
            toUserId: parseInt(userId)
          }
        ]
      },
      order: [['create_time', 'ASC']]
    });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('获取聊天记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取未读消息数量
router.get('/unread', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    const unreadCounts = await Message.findAll({
      attributes: [
        'fromUserId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        toUserId: parseInt(userId),
        isRead: false
      },
      group: ['fromUserId']
    });

    res.json({
      success: true,
      data: unreadCounts
    });
  } catch (error) {
    console.error('获取未读消息数量失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 标记单条消息为已读
router.put('/read/:messageId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { messageId } = req.params;

    await Message.update(
      { isRead: true },
      {
        where: {
          id: parseInt(messageId),
          toUserId: parseInt(userId)
        }
      }
    );

    res.json({
      success: true,
      message: '消息已标记为已读'
    });
  } catch (error) {
    console.error('标记消息已读失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 标记与指定好友的所有消息为已读
router.put('/read/:friendId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { friendId } = req.params;

    await Message.update(
      { isRead: true },
      {
        where: {
          fromUserId: parseInt(friendId),
          toUserId: parseInt(userId),
          isRead: false
        }
      }
    );

    res.json({
      success: true,
      message: '所有消息已标记为已读'
    });
  } catch (error) {
    console.error('标记消息已读失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 