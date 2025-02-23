const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const { minioClient, bucket } = require('../config/minio');

// 配置文件上传
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

// 获取用户信息
router.get('/profile', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const user = await User.findByPk(parseInt(userId), {
      attributes: ['id', 'username', 'nickname', 'avatar', 'signature']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新用户信息
router.put('/profile', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const { nickname, signature } = req.body;

    const user = await User.findByPk(parseInt(userId));
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    await user.update({
      nickname,
      signature,
      update_time: new Date()
    });

    // 返回更新后的用户信息
    const updatedUser = await User.findByPk(parseInt(userId), {
      attributes: ['id', 'username', 'nickname', 'avatar', 'signature']
    });

    res.json({
      success: true,
      message: '更新成功',
      data: updatedUser
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新头像
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const user = await User.findByPk(parseInt(userId));
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
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
    const filename = `avatars/${userId}_${Date.now()}${ext}`;

    // 上传到MinIO
    await minioClient.putObject(bucket, filename, req.file.buffer);

    // 生成访问URL
    const avatarUrl = `http://113.45.161.48:9000/${bucket}/${filename}`;

    // 更新用户头像
    await user.update({
      avatar: avatarUrl,
      update_time: new Date()
    });

    // 返回更新后的用户信息
    const updatedUser = await User.findByPk(parseInt(userId), {
      attributes: ['id', 'username', 'nickname', 'avatar', 'signature']
    });

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('上传头像失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 修改密码
router.put('/password', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const { oldPassword, newPassword } = req.body;

    const user = await User.findByPk(parseInt(userId));
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 验证旧密码
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: '原密码错误'
      });
    }

    // 加密新密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 更新密码
    await user.update({
      password: hashedPassword,
      update_time: new Date()
    });

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 