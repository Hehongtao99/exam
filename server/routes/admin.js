const express = require('express');
const router = express.Router();
const { User, QuestionBank, Exam, MistakeBook, Question } = require('../models');
const adminAuth = require('../middleware/adminAuth');
const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');

// 获取所有用户列表
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword } = req.query;
    const offset = (page - 1) * pageSize;
    
    const where = {};
    if (keyword) {
      where[Sequelize.Op.or] = [
        { username: { [Sequelize.Op.like]: `%${keyword}%` } },
        { nickname: { [Sequelize.Op.like]: `%${keyword}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: ['id', 'username', 'nickname', 'avatar', 'role', 'create_time', 'update_time'],
      offset,
      limit: parseInt(pageSize),
      order: [['create_time', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取用户详细信息
router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: ['id', 'username', 'nickname', 'avatar', 'signature', 'role', 'create_time', 'update_time']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新用户状态
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    await user.update({
      role: role || user.role,
      update_time: new Date()
    });

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新用户状态失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取最近注册用户
router.get('/recent-users', adminAuth, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'nickname', 'avatar', 'create_time'],
      order: [['create_time', 'DESC']],
      limit: 10
    });
    
    res.json({
      success: true,
      data: users
    });
  } catch (err) {
    console.error('获取最近注册用户失败:', err);
    res.status(500).json({ success: false, message: '获取最近注册用户失败' });
  }
});

// 获取题库列表
router.get('/question-banks', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword } = req.query;
    const offset = (page - 1) * pageSize;
    
    const where = {};
    if (keyword) {
      where.name = { [Sequelize.Op.like]: `%${keyword}%` };
    }

    const { count, rows } = await QuestionBank.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'nickname']
        },
        {
          model: Question,
          as: 'questions',
          attributes: ['id']
        }
      ],
      offset,
      limit: parseInt(pageSize),
      order: [['create_time', 'DESC']]
    });

    const questionBanks = rows.map(bank => ({
      ...bank.toJSON(),
      questionCount: bank.questions?.length || 0
    }));

    res.json({
      success: true,
      data: {
        list: questionBanks,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取题库列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 创建题库
router.post('/question-banks', adminAuth, async (req, res) => {
  try {
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
      userId: parseInt(req.headers['x-user-id']),
      create_time: new Date(),
      update_time: new Date()
    });

    res.json({
      success: true,
      message: '创建成功',
      data: questionBank
    });
  } catch (error) {
    console.error('创建题库失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新题库
router.put('/question-banks/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const questionBank = await QuestionBank.findByPk(id);
    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: '题库不存在'
      });
    }

    await questionBank.update({
      name,
      description,
      update_time: new Date()
    });

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新题库失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新题库状态
router.put('/question-banks/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const questionBank = await QuestionBank.findByPk(id);
    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: '题库不存在'
      });
    }

    await questionBank.update({
      update_time: new Date()
    });

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新题库状态失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取系统统计数据
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [userCount, bankCount, examCount, avgScore] = await Promise.all([
      User.count(),
      QuestionBank.count(),
      Exam.count(),
      Exam.findOne({
        attributes: [
          [sequelize.fn('AVG', sequelize.col('score')), 'avgScore']
        ],
        raw: true
      }).then(result => Math.round(result?.avgScore || 0))
    ]);
    
    res.json({
      success: true,
      data: {
        userCount,
        bankCount,
        examCount,
        avgScore
      }
    });
  } catch (err) {
    console.error('获取统计信息失败:', err);
    res.status(500).json({ success: false, message: '获取统计信息失败' });
  }
});

// 获取最近考试记录
router.get('/recent-exams', adminAuth, async (req, res) => {
  try {
    const exams = await Exam.findAll({
      include: [
        {
          model: User,
          as: 'examUser',
          attributes: ['id', 'username', 'nickname']
        },
        {
          model: QuestionBank,
          as: 'examBank',
          attributes: ['id', 'name']
        }
      ],
      order: [['create_time', 'DESC']],
      limit: 10
    });
    
    res.json({
      success: true,
      data: exams
    });
  } catch (err) {
    console.error('获取最近考试记录失败:', err);
    res.status(500).json({ success: false, message: '获取最近考试记录失败' });
  }
});

// 获取用户统计信息
router.get('/users/:id/stats', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const [bankCount, examCount, avgScore] = await Promise.all([
      QuestionBank.count({ where: { userId: id } }),
      Exam.count({ where: { userId: id } }),
      Exam.findOne({
        where: { userId: id },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('score')), 'avgScore']
        ],
        raw: true
      })
    ]);

    res.json({
      success: true,
      data: {
        bankCount,
        examCount,
        avgScore: Math.round(avgScore?.avgScore || 0)
      }
    });
  } catch (error) {
    console.error('获取用户统计信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取用户考试记录
router.get('/users/:id/exams', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const exams = await Exam.findAll({
      where: { userId: id },
      include: [{
        model: QuestionBank,
        as: 'examBank',
        attributes: ['id', 'name']
      }],
      order: [['create_time', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: exams
    });
  } catch (error) {
    console.error('获取用户考试记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 删除题库
router.delete('/question-banks/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const questionBank = await QuestionBank.findByPk(id);
    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: '题库不存在'
      });
    }

    // 删除题库下的所有题目
    await Question.destroy({
      where: { bankId: id }
    });

    // 删除题库
    await questionBank.destroy();

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除题库失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取题库详情
router.get('/question-banks/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 获取题库信息和题目数量
    const questionBank = await QuestionBank.findOne({
      where: { id },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'nickname']
      }]
    });

    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: '题库不存在'
      });
    }

    // 获取题目数量
    const questionCount = await Question.count({
      where: { bankId: id }
    });

    // 将题目数量添加到返回数据中
    const data = questionBank.toJSON();
    data.questionCount = questionCount;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('获取题库详情失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取题库的题目列表
router.get('/question-banks/:id/questions', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    
    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await Question.findAndCountAll({
      where: { bankId: id },
      limit: parseInt(pageSize),
      offset: parseInt(offset),
      order: [['create_time', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取题目列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 添加题目
router.post('/question-banks/:id/questions', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, content, options, answer, analysis } = req.body;

    if (!type || !content || !answer) {
      return res.status(400).json({
        success: false,
        message: '题目类型、内容和答案不能为空'
      });
    }

    const questionBank = await QuestionBank.findByPk(id);
    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: '题库不存在'
      });
    }

    const question = await Question.create({
      bankId: id,
      type,
      content,
      options: options ? JSON.stringify(options) : null,
      answer,
      analysis
    });

    res.json({
      success: true,
      message: '添加题目成功',
      data: question
    });
  } catch (error) {
    console.error('添加题目失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新题目
router.put('/questions/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, content, options, answer, analysis } = req.body;

    const question = await Question.findByPk(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    await question.update({
      type,
      content,
      options: options ? JSON.stringify(options) : null,
      answer,
      analysis,
      update_time: new Date()
    });

    res.json({
      success: true,
      message: '更新题目成功',
      data: question
    });
  } catch (error) {
    console.error('更新题目失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 删除题目
router.delete('/questions/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const question = await Question.findByPk(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    await question.destroy();

    res.json({
      success: true,
      message: '删除题目成功'
    });
  } catch (error) {
    console.error('删除题目失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
