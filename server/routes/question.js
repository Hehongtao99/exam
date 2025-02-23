const express = require('express');
const router = express.Router();
const Question = require('../models/question');
const QuestionBank = require('../models/questionBank');
const ExamDetail = require('../models/examDetail');
const MistakeRecord = require('../models/mistakeRecord');
const { sequelize } = require('../config/db');

// 创建题目
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const { bankId, type, content, options, answer, analysis } = req.body;
    
    if (!bankId || !type || !content || !answer) {
      return res.status(400).json({
        success: false,
        message: '题库ID、题目类型、内容和答案不能为空'
      });
    }

    // 检查题库是否存在且属于当前用户
    const questionBank = await QuestionBank.findOne({
      where: { 
        id: bankId,
        userId: parseInt(userId)
      }
    });

    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: '题库不存在或无权访问'
      });
    }

    const question = await Question.create({
      bankId,
      type,
      content,
      options: options ? JSON.stringify(options) : null,
      answer,
      analysis
    });

    res.json({
      success: true,
      message: '题目创建成功',
      data: question
    });
  } catch (error) {
    console.error('创建题目错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 获取题目列表
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const { bankId, type } = req.query;
    
    // 检查题库是否属于当前用户
    const questionBank = await QuestionBank.findOne({
      where: { 
        id: bankId,
        userId: parseInt(userId)
      }
    });

    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: '题库不存在或无权访问'
      });
    }

    const where = { bankId };
    if (type) {
      where.type = type;
    }

    const questions = await Question.findAll({
      where,
      include: [{
        model: QuestionBank,
        as: 'bank',
        where: { userId: parseInt(userId) }
      }],
      order: [['create_time', 'DESC']]
    });

    // 处理选项字段
    const processedQuestions = questions.map(q => {
      const question = q.toJSON();
      if (question.options) {
        question.options = JSON.parse(question.options);
      }
      return question;
    });

    res.json({
      success: true,
      data: processedQuestions
    });
  } catch (error) {
    console.error('获取题目列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 获取题目详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const question = await Question.findOne({
      where: { id },
      include: [{
        model: QuestionBank,
        as: 'bank',
        where: { userId: parseInt(userId) }
      }]
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在或无权访问'
      });
    }

    // 处理选项字段
    const processedQuestion = question.toJSON();
    if (processedQuestion.options) {
      processedQuestion.options = JSON.parse(processedQuestion.options);
    }

    res.json({
      success: true,
      data: processedQuestion
    });
  } catch (error) {
    console.error('获取题目详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 更新题目
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const question = await Question.findOne({
      where: { id },
      include: [{
        model: QuestionBank,
        as: 'bank',
        where: { userId: parseInt(userId) }
      }]
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在或无权访问'
      });
    }

    const { type, content, options, answer, analysis } = req.body;

    await question.update({
      type,
      content,
      options: options ? (typeof options === 'string' ? options : JSON.stringify(options)) : null,
      answer,
      analysis,
      update_time: new Date()
    });

    res.json({
      success: true,
      message: '题目更新成功',
      data: question
    });
  } catch (error) {
    console.error('更新题目错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 删除题目
router.delete('/:id', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }
    
    const question = await Question.findOne({
      where: { id },
      include: [{
        model: QuestionBank,
        as: 'bank',
        where: { userId: parseInt(userId) }
      }]
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在或无权访问'
      });
    }

    // 先删除相关的考试记录
    await ExamDetail.destroy({
      where: { questionId: id },
      transaction: t
    });

    // 删除错题本记录
    await MistakeRecord.destroy({
      where: { questionId: id },
      transaction: t
    });

    // 最后删除题目
    await question.destroy({ transaction: t });
    
    await t.commit();

    res.json({
      success: true,
      message: '题目删除成功'
    });
  } catch (error) {
    await t.rollback();
    console.error('删除题目错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

module.exports = router; 