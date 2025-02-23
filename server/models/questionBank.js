const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./user');
const Question = require('./question');

const QuestionBank = sequelize.define('QuestionBank', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '题库名称'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '题库描述'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '创建者ID'
  },
  create_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  },
  update_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '更新时间'
  }
}, {
  tableName: 'question_banks',
  timestamps: false
});

// 建立与用户的关联（不使用外键约束）
QuestionBank.belongsTo(User, {
  foreignKey: 'userId',
  as: 'creator',
  constraints: false
});

// 建立与题目的关联（不使用外键约束）
QuestionBank.hasMany(Question, {
  foreignKey: 'bankId',
  as: 'questions',
  constraints: false
});

Question.belongsTo(QuestionBank, {
  foreignKey: 'bankId',
  as: 'questionBank',
  constraints: false
});

module.exports = QuestionBank; 