const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Group = sequelize.define('Group', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  group_number: {
    type: DataTypes.STRING(4),
    allowNull: false,
    unique: true,
    comment: '群号(4位数字)'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '群组名称'
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '群头像'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '群描述'
  },
  owner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '群主ID'
  },
  announcement: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '群公告'
  },
  create_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  update_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'groups',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['group_number']
    }
  ]
});

module.exports = Group; 