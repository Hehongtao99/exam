const express = require('express');
const cors = require('cors');
const app = express();
const auth = require('./middleware/auth');
const { createServer } = require('http');
const { initWebSocket } = require('./websocket');

// 数据库连接
require('./config/db');

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由配置
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/friend', require('./routes/friend'));
app.use('/api/message', require('./routes/message'));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('服务器内部错误');
});

// 创建HTTP服务器
const server = createServer(app);

// 初始化WebSocket
initWebSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
