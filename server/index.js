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
const groupRoutes = require('./routes/group');

// 导入所有模型以确保关联关系被正确建立
require('./models');

const app = express();
const server = http.createServer(app);

// 配置 CORS
app.use(cors());

// 配置请求体解析
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置静态文件服务
app.use('/uploads', express.static('uploads'));

// 配置路由
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
app.use('/api/groups', groupRoutes);

// 初始化WebSocket
initWebSocket(server);

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

// 初始化数据库
initDB(); 