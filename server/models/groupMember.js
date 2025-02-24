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
    comment: '成员角色: owner-群主, admin-管理员, member-普通成员'
  },
  mute_end_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '禁言结束时间'
  },
  join_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '加入时间'
  },
  last_read_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '最后阅读时间'
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