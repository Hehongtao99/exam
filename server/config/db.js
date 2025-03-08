const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('exam', 'root', 'hht500234', {
  host: '113.45.161.48',
  dialect: 'mysql',
  port: 3306,
  pool: {
    max: 5,
    min: 0,
    acquire: 60000, // 增加获取连接的超时时间到60秒
    idle: 10000
  },
  dialectOptions: {
    connectTimeout: 60000, // 增加连接超时时间到60秒
    // 添加重试选项
    retry: {
      match: [
        /Deadlock/i,
        /ETIMEDOUT/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /EHOSTUNREACH/,
        /EPIPE/,
        /EAI_AGAIN/,
      ],
      max: 3 // 最大重试次数
    }
  },
  define: {
    timestamps: false, // 全局禁用时间戳
    freezeTableName: true, // 禁止表名复数化
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    // 禁用外键约束
    constraints: false
  },
  timezone: '+08:00', // 设置时区为北京时间
  logging: false // 关闭SQL日志
});

const initDB = async () => {
  try {
    // 添加重试逻辑
    let retries = 3;
    while (retries > 0) {
      try {
        await sequelize.authenticate();
        console.log('数据库连接成功');
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        console.log(`数据库连接失败，剩余重试次数: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒后重试
      }
    }

    // 导入所有模型
    require('../models');

    // 同步数据库表结构，但不强制更新
    await sequelize.sync({ alter: false });
    console.log('数据库表结构同步成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  initDB
}; 