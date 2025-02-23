const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('exam', 'root', 'hht500234', {
  host: '113.45.161.48',
  dialect: 'mysql',
  port: 3306,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: false, // 全局禁用时间戳
    freezeTableName: true, // 禁止表名复数化
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  },
  timezone: '+08:00', // 设置时区为北京时间
  logging: false // 关闭SQL日志
});

const initDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    return false;
  }
};

module.exports = { sequelize, initDB }; 