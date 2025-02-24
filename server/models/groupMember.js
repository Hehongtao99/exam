const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const GroupMember = sequelize.define('GroupMember', {
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
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '群昵称'
  },
  role: {
    type: DataTypes.ENUM('owner', 'admin', 'member'),
    allowNull: false,
    defaultValue: 'member',
    comment: '成员角色'
  },
  join_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'group_members',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['group_id', 'user_id']
    }
  ]
});

module.exports = GroupMember; 