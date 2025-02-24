const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const GroupMessageRead = sequelize.define('GroupMessageRead', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '群组ID'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  last_read_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '最后读取时间'
  }
}, {
  tableName: 'group_message_read',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['group_id', 'user_id']
    }
  ]
});

module.exports = GroupMessageRead; 