const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const GroupRequest = sequelize.define('GroupRequest', {
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
    comment: '申请用户ID'
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
    comment: '申请状态'
  },
  create_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'group_requests',
  timestamps: false,
  indexes: [
    {
      fields: ['group_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = GroupRequest; 