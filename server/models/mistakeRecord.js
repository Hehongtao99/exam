const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MistakeRecord = sequelize.define('MistakeRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bookId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  create_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'mistake_records',
  timestamps: false
});

module.exports = MistakeRecord; 