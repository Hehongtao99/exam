const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./user');
const Group = require('./group');

const GroupMessage = sequelize.define('group_message', {
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
  fromUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'text'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  isRecalled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  recallTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'group_messages',
  timestamps: false,
  indexes: [
    {
      fields: ['groupId']
    },
    {
      fields: ['fromUserId']
    },
    {
      fields: ['createTime']
    }
  ]
});

// 关联关系
GroupMessage.belongsTo(User, {
  foreignKey: 'fromUserId',
  as: 'fromUser'
});

GroupMessage.belongsTo(Group, {
  foreignKey: 'groupId',
  as: 'group'
});

module.exports = GroupMessage; 