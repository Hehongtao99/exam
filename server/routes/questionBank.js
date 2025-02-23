const express = require('express');
const router = express.Router();
const QuestionBank = require('../models/questionBank');
const Question = require('../models/question');
const { sequelize } = require('../config/db');

// 创建题库
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '题库名称不能为空'
      });
    }

    const questionBank = await QuestionBank.create({
      name,
      description,
      userId: parseInt(userId)
    });

    res.json({
      success: true,
      message: '题库创建成功',
      data: questionBank
    });
  } catch (error) {
    console.error('创建题库错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 获取题库列表
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const questionBanks = await QuestionBank.findAll({
      where: { userId: parseInt(userId) },
      include: [{
        model: Question,
        as: 'questions',
        attributes: ['id']  // 只需要id来计算数量
      }],
      order: [['create_time', 'DESC']]
    });

    res.json({
      success: true,
      data: questionBanks
    });
  } catch (error) {
    console.error('获取题库列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 获取题库详情
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

    const questionBank = await QuestionBank.findOne({
      where: { 
        id,
        userId: parseInt(userId)
      },
      include: [{
        model: Question,
        as: 'questions'
      }]
    });

    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: '题库不存在或无权访问'
      });
    }

    res.json({
      success: true,
      data: questionBank
    });
  } catch (error) {
    console.error('获取题库详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 更新题库
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

    const { name, description } = req.body;
    
    const questionBank = await QuestionBank.findOne({
      where: { 
        id,
        userId: parseInt(userId)
      }
    });

    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: '题库不存在或无权访问'
      });
    }

    await questionBank.update({
      name,
      description,
      update_time: new Date()
    });

    res.json({
      success: true,
      message: '题库更新成功',
      data: questionBank
    });
  } catch (error) {
    console.error('更新题库错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 删除题库
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }
    
    const questionBank = await QuestionBank.findOne({
      where: { 
        id,
        userId: parseInt(userId)
      }
    });

    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: '题库不存在或无权访问'
      });
    }

    // 删除题库下的所有题目
    await Question.destroy({
      where: {
        bankId: id
      }
    });

    // 删除题库
    await questionBank.destroy();

    res.json({
      success: true,
      message: '题库删除成功'
    });
  } catch (error) {
    console.error('删除题库错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 接收分享的题库
router.post('/accept', async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const userId = req.headers['x-user-id'];
    const { bankIds, fromUserId } = req.body;
    
    if (!userId || !bankIds || !fromUserId) {
      return res.status(400).json({
        success: false,
        message: '参数不完整'
      });
    }

    // 获取原题库及其题目
    const originalBanks = await QuestionBank.findAll({
      where: {
        id: bankIds,
        userId: fromUserId
      },
      include: [{
        model: Question,
        as: 'questions'
      }],
      transaction
    });

    if (originalBanks.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '题库不存在'
      });
    }

    // 为每个题库创建副本
    const results = await Promise.all(originalBanks.map(async (bank) => {
      // 创建新题库
      const newBank = await QuestionBank.create({
        name: bank.name,
        description: bank.description,
        userId: parseInt(userId),
        create_time: new Date(),
        update_time: new Date()
      }, { transaction });

      // 复制题目
      if (bank.questions && bank.questions.length > 0) {
        const questions = bank.questions.map(q => ({
          bankId: newBank.id,
          type: q.type,
          content: q.content,
          options: q.options,
          answer: q.answer,
          analysis: q.analysis,
          create_time: new Date(),
          update_time: new Date()
        }));

        await Question.bulkCreate(questions, { transaction });
      }

      return newBank;
    }));

    await transaction.commit();

    res.json({
      success: true,
      message: '题库添加成功',
      data: results
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('接收题库失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 