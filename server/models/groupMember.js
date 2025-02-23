const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./user');
const Group = require('./group');

const GroupMember = sequelize.define('group_member', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'groups',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('owner', 'admin', 'member'),
    allowNull: false,
    defaultValue: 'member'
  },
  muteEndTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'left', 'kicked'),
    allowNull: false,
    defaultValue: 'active'
  },
  joinTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'group_members',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['groupId', 'userId']
    }
  ]
});

// 关联关系
GroupMember.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

GroupMember.belongsTo(Group, {
  foreignKey: 'groupId',
  as: 'group'
});

module.exports = GroupMember; 