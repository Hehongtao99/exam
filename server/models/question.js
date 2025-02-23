const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bankId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '所属题库ID'
  },
  type: {
    type: DataTypes.ENUM('single', 'multiple', 'judge', 'essay'),
    allowNull: false,
    comment: '题目类型：single-单选题，multiple-多选题，judge-判断题，essay-问答题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '题目内容'
  },
  options: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '选项，格式：{A: "选项内容", B: "选项内容", ...}'
  },
  answer: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '答案。单选题：A/B/C/D，多选题：A,B,C，判断题：true/false，问答题：文本'
  },
  analysis: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '题目解析'
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
  tableName: 'questions',
  timestamps: false
});

module.exports = Question; 