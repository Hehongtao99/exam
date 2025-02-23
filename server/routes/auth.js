const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名已存在' 
      });
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 创建新用户
    await User.create({
      username,
      password: hashedPassword,
      role: 'user' // 默认角色为普通用户
    });

    res.json({ 
      success: true, 
      message: '注册成功' 
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('登录请求：', { username });

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      });
    }

    // 查找用户
    const user = await User.findOne({ 
      where: { username },
      attributes: ['id', 'username', 'password', 'nickname', 'avatar', 'signature', 'role']
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }

    console.log('查询到的用户信息：', {
      id: user.id,
      username: user.username,
      role: user.role
    });

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名或密码错误' 
      });
    }

    const userData = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      signature: user.signature,
      role: user.role
    };

    console.log('返回给客户端的用户信息：', userData);

    res.json({ 
      success: true, 
      message: '登录成功',
      user: userData
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后重试' 
    });
  }
});

module.exports = router; 