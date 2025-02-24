const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const GroupMessage = sequelize.define('GroupMessage', {
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
  from_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '发送者ID'
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'text',
    comment: '消息类型'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '消息内容'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '消息元数据'
  },
  create_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'group_messages',
  timestamps: false,
  indexes: [
    {
      fields: ['group_id']
    },
    {
      fields: ['from_user_id']
    },
    {
      fields: ['create_time']
    }
  ]
});

module.exports = GroupMessage; 