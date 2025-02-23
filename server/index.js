const express = require('express');
const cors = require('cors');
const http = require('http');
const { initDB } = require('./config/db');
const { initWebSocket } = require('./websocket');
const authRoutes = require('./routes/auth');
const questionBankRoutes = require('./routes/questionBank');
const questionRoutes = require('./routes/question');
const examRoutes = require('./routes/exam');
const userRoutes = require('./routes/user');
const dashboardRoutes = require('./routes/dashboard');
const friendRoutes = require('./routes/friend');
const messageRoutes = require('./routes/message');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');

// 导入所有模型以确保关联关系被正确建立
require('./models');

const app = express();
const server = http.createServer(app);

// 初始化WebSocket
initWebSocket(server);

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// 中间件
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // 添加静态文件服务

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/question-banks', questionBankRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

// 404处理
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

const startServer = async () => {
  try {
    // 初始化数据库
    const dbInitialized = await initDB();
    if (!dbInitialized) {
      console.error('数据库初始化失败，服务器启动终止');
      process.exit(1);
    }

    // 启动服务器
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer(); 