const express = require('express');
const router = express.Router();
const QuestionBank = require('../models/questionBank');
const Question = require('../models/question');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const User = require('../models/user');

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

    const now = new Date();
    const questionBank = await QuestionBank.create({
      name,
      description: description || '',  // 如果没有提供description，则使用空字符串
      userId: parseInt(userId),
      is_public: false,
      create_time: now,
      update_time: now
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
router.post('/details', async (req, res) => {
  try {
    const { bankIds } = req.body;
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    if (!Array.isArray(bankIds) || bankIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择题库'
      });
    }

    const questionBanks = await QuestionBank.findAll({
      where: {
        id: {
          [Op.in]: bankIds
        },
        userId: parseInt(userId) // 只查询用户自己的题库
      },
      include: [
        {
          model: Question,
          as: 'questions',
          attributes: ['id', 'type', 'content', 'options', 'answer', 'analysis'] // 修改 explanation 为 analysis
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ]
    });

    const formattedBanks = questionBanks.map(bank => ({
      id: bank.id,
      name: bank.name,
      description: bank.description,
      questionCount: bank.questions.length,
      questions: bank.questions.map(q => ({
        id: q.id,
        type: q.type,
        content: q.content,
        options: q.options,
        answer: q.answer,
        analysis: q.analysis // 修改 explanation 为 analysis
      })),
      creator: {
        id: bank.creator.id,
        username: bank.creator.username,
        nickname: bank.creator.nickname,
        avatar: bank.creator.avatar
      }
    }));

    res.json({
      success: true,
      data: formattedBanks
    });
  } catch (error) {
    console.error('获取题库详情失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
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
  const t = await sequelize.transaction();
  try {
    const userId = parseInt(req.headers['x-user-id']);
    const { bankIds, fromUserId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    // 验证参数
    if (!Array.isArray(bankIds) || bankIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '参数错误'
      });
    }

    if (!fromUserId) {
      return res.status(400).json({
        success: false,
        message: '发送者ID不能为空'
      });
    }

    // 获取原题库信息
    const sourceBanks = await QuestionBank.findAll({
      where: {
        id: {
          [Op.in]: bankIds
        },
        userId: parseInt(fromUserId)
      },
      include: [{
        model: Question,
        as: 'questions'
      }],
      transaction: t
    });

    if (sourceBanks.length !== bankIds.length) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: '部分题库不存在'
      });
    }

    // 复制题库和题目
    for (const sourceBank of sourceBanks) {
      // 创建新题库
      const now = new Date();
      const newBank = await QuestionBank.create({
        name: sourceBank.name,
        description: sourceBank.description,
        userId: userId,
        type: sourceBank.type,
        is_public: false,
        create_time: now,
        update_time: now
      }, { transaction: t });

      // 复制题目
      if (sourceBank.questions && sourceBank.questions.length > 0) {
        const questions = sourceBank.questions.map(q => ({
          bankId: newBank.id,
          type: q.type,
          content: q.content,
          options: q.options,
          answer: q.answer,
          analysis: q.analysis,
          create_time: now,
          update_time: now
        }));

        await Question.bulkCreate(questions, { transaction: t });
      }
    }

    await t.commit();
    res.json({
      success: true,
      message: '题库接收成功'
    });
  } catch (error) {
    await t.rollback();
    console.error('接收题库失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取我的题库列表
router.get('/my', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const questionBanks = await QuestionBank.findAll({
      where: {
        userId: parseInt(userId)
      },
      attributes: ['id', 'name', 'description', 'create_time', 'update_time'],
      include: [
        {
          model: Question,
          as: 'questions',
          attributes: ['id'],
          required: false
        }
      ]
    });

    const formattedBanks = questionBanks.map(bank => ({
      id: bank.id,
      name: bank.name,
      description: bank.description,
      questionCount: bank.questions?.length || 0,
      createTime: bank.create_time,
      updateTime: bank.update_time
    }));

    res.json({
      success: true,
      data: formattedBanks
    });
  } catch (error) {
    console.error('获取我的题库列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取公共题库列表
router.get('/public', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const questionBanks = await QuestionBank.findAll({
      where: {
        is_public: true,
        userId: {
          [Op.ne]: parseInt(userId)
        }
      },
      attributes: ['id', 'name', 'description', 'create_time', 'update_time'],
      include: [
        {
          model: Question,
          as: 'questions',
          attributes: ['id'],
          required: false
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ]
    });

    const formattedBanks = questionBanks.map(bank => ({
      id: bank.id,
      name: bank.name,
      description: bank.description,
      questionCount: bank.questions?.length || 0,
      createTime: bank.create_time,
      updateTime: bank.update_time,
      creator: {
        id: bank.creator.id,
        username: bank.creator.username,
        nickname: bank.creator.nickname,
        avatar: bank.creator.avatar
      }
    }));

    res.json({
      success: true,
      data: formattedBanks
    });
  } catch (error) {
    console.error('获取公共题库列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取单个题库详情
router.get('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const bankId = parseInt(req.params.id);
    const questionBank = await QuestionBank.findOne({
      where: {
        id: bankId,
        [Op.or]: [
          { userId: parseInt(userId) },
          { is_public: true }
        ]
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'nickname', 'avatar']
        },
        {
          model: Question,
          as: 'questions',
          attributes: ['id', 'type', 'content', 'options', 'answer', 'analysis']
        }
      ]
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
    console.error('获取题库详情失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 