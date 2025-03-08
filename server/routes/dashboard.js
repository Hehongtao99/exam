const express = require('express');
const router = express.Router();
const { QuestionBank, Exam, MistakeRecord, Question, MistakeBook } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');

// 获取统计数据
router.get('/stats', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const [bankCount, examCount, avgScore, mistakeCount] = await Promise.all([
      // 题库数量
      QuestionBank.count({
        where: { userId: parseInt(userId) }
      }),
      // 考试次数
      Exam.count({
        where: { userId: parseInt(userId) }
      }),
      // 平均分数
      Exam.findOne({
        where: { userId: parseInt(userId) },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('score')), 'avgScore']
        ],
        raw: true
      }),
      // 错题数量
      MistakeRecord.count({
        include: [{
          model: MistakeBook,
          as: 'mistakeBook',
          where: { userId: parseInt(userId) }
        }]
      })
    ]);

    res.json({
      success: true,
      data: {
        bankCount,
        examCount,
        avgScore: Math.round(avgScore?.avgScore || 0),
        mistakeCount
      }
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取最近考试记录
router.get('/recent-exams', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const exams = await Exam.findAll({
      where: { userId: parseInt(userId) },
      include: [{
        model: QuestionBank,
        as: 'examBank',
        attributes: ['name']
      }],
      order: [['create_time', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: exams
    });
  } catch (error) {
    console.error('获取最近考试记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取错题分布
router.get('/mistake-stats', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const mistakes = await MistakeBook.findAll({
      where: { userId: parseInt(userId) },
      include: [{
        model: MistakeRecord,
        as: 'mistakeRecords',
        include: [{
          model: Question,
          as: 'question',
          attributes: ['type']
        }]
      }]
    });

    // 统计各类型题目的数量
    const stats = {
      single: 0,
      multiple: 0,
      judge: 0,
      essay: 0
    };

    mistakes.forEach(book => {
      book.mistakeRecords?.forEach(record => {
        if (record.question?.type) {
          stats[record.question.type]++;
        }
      });
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取错题分布失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 