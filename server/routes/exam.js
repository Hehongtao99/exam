const express = require('express');
const router = express.Router();
const { Exam, ExamDetail, Question, MistakeBook, MistakeRecord, QuestionBank } = require('../models');
const { sequelize } = require('../config/db');

// 处理答案的辅助函数
const processAnswers = async (answers) => {
  let correctCount = 0;
  const details = [];
  
  for (const answer of answers) {
    const question = await Question.findByPk(answer.questionId);
    let isCorrect = false;
    
    // 根据题目类型判断答案是否正确
    switch (question.type) {
      case 'multiple':
        // 多选题答案是逗号分隔的字母，按字母顺序排序后比较
        const userAnswers = answer.userAnswer.split(',').sort();
        const correctAnswers = question.answer.split(',').sort();
        isCorrect = JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
        break;
      
      case 'judge':
        // 判断题答案比较字符串
        isCorrect = answer.userAnswer === question.answer;
        break;
      
      case 'single':
        // 单选题直接比较字母
        isCorrect = answer.userAnswer === question.answer;
        break;
        
      case 'essay':
        // 问答题需要教师手动评分，这里暂时标记为错误
        isCorrect = false;
        break;
    }
    
    if (isCorrect) correctCount++;
    
    details.push({
      questionId: answer.questionId,
      userAnswer: answer.userAnswer,
      isCorrect
    });
  }
  
  const totalQuestions = answers.length;
  const wrongCount = totalQuestions - correctCount;
  const score = Math.round((correctCount / totalQuestions) * 100);
  
  return {
    score,
    totalQuestions,
    correctCount,
    wrongCount,
    details
  };
};

// 开始考试（获取题目）
router.get('/start/:bankId', async (req, res) => {
  try {
    const { bankId } = req.params;
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

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

    const questions = await Question.findAll({
      where: { bankId },
      attributes: ['id', 'type', 'content', 'options', 'answer']
    });

    // 确保选项是JSON格式
    questions.forEach(question => {
      if (question.type === 'single' || question.type === 'multiple') {
        question.options = typeof question.options === 'string' 
          ? JSON.parse(question.options) 
          : question.options;
      }
    });

    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('获取考试题目失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 提交考试
router.post('/submit', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const { bankId, answers } = req.body;
    
    // 验证答案格式
    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: '答案格式错误'
      });
    }

    // 获取题目信息
    const questions = await Question.findAll({
      where: {
        id: answers.map(a => a.questionId)
      }
    });

    // 计算得分
    let correctCount = 0;
    let wrongCount = 0;
    const details = [];

    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      let isCorrect = false;
      let processedAnswer = '';
      
      // 根据题目类型处理答案
      switch (question.type) {
        case 'single':
          processedAnswer = answer.userAnswer || '';
          isCorrect = processedAnswer === question.answer;
          break;
          
        case 'multiple':
          // 确保多选题答案始终是数组
          const userAnswerArray = Array.isArray(answer.userAnswer) 
            ? answer.userAnswer 
            : (answer.userAnswer ? answer.userAnswer.split(',') : []);
          processedAnswer = userAnswerArray.sort().join(',');
          const correctAnswers = question.answer.split(',').sort().join(',');
          isCorrect = processedAnswer === correctAnswers;
          break;
        
        case 'judge':
          processedAnswer = answer.userAnswer || '';
          isCorrect = processedAnswer === question.answer;
          break;
          
        case 'essay':
          processedAnswer = answer.userAnswer || '';
          isCorrect = false;
          break;
      }

      if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }

      details.push({
        questionId: answer.questionId,
        userAnswer: processedAnswer,
        isCorrect
      });
    }

    const totalQuestions = answers.length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    // 创建考试记录
    const exam = await Exam.create({
      userId: parseInt(userId),
      bankId,
      score,
      total_questions: totalQuestions,
      correct_count: correctCount,
      wrong_count: wrongCount
    }, { transaction: t });

    // 创建考试详情记录，确保user_answer不为空
    await ExamDetail.bulkCreate(details.map(detail => ({
      examId: exam.id,
      questionId: detail.questionId,
      user_answer: detail.userAnswer || '',  // 确保user_answer不为空
      is_correct: detail.isCorrect
    })), { transaction: t });

    await t.commit();

    res.json({
      success: true,
      data: {
        examId: exam.id,
        score,
        totalQuestions,
        correctCount,
        wrongCount,
        details
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('提交考试失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取考试历史
router.get('/history/:userId', async (req, res) => {
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
        model: ExamDetail,
        include: [Question]
      }],
      order: [['create_time', 'DESC']]
    });
    
    res.json({
      success: true,
      data: exams
    });
  } catch (error) {
    console.error('获取考试历史失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 创建错题本
router.post('/mistake-book', async (req, res) => {
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
        message: '错题本名称不能为空'
      });
    }

    const mistakeBook = await MistakeBook.create({
      userId: parseInt(userId),
      name,
      description
    });

    res.json({
      success: true,
      message: '创建成功',
      data: mistakeBook
    });
  } catch (error) {
    console.error('创建错题本失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 添加错题到错题本
router.post('/mistake-book/add', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const { bookId, questionIds } = req.body;

    // 检查错题本是否属于当前用户
    const book = await MistakeBook.findOne({
      where: { 
        id: bookId,
        userId: parseInt(userId)
      }
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: '错题本不存在或无权访问'
      });
    }
    
    // 批量创建错题记录
    await MistakeRecord.bulkCreate(
      questionIds.map(questionId => ({
        bookId,
        questionId
      })),
      { 
        transaction: t,
        ignoreDuplicates: true
      }
    );
    
    await t.commit();
    
    res.json({
      success: true,
      message: '添加成功'
    });
  } catch (error) {
    await t.rollback();
    console.error('添加错题失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取错题本列表
router.get('/mistake-book/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const mistakeBooks = await MistakeBook.findAll({
      where: { userId: parseInt(userId) },
      include: [{
        model: MistakeRecord,
        as: 'mistakeRecords',
        include: [{
          model: Question,
          as: 'question',
          attributes: ['content', 'type', 'options', 'answer']
        }]
      }],
      order: [['create_time', 'DESC']]
    });

    // 打印返回的数据以便调试
    console.log('Mistake books data:', JSON.stringify(mistakeBooks, null, 2));

    res.json({
      success: true,
      data: mistakeBooks
    });
  } catch (error) {
    console.error('获取错题本列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 获取考试结果
router.get('/:examId/result', async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const exam = await Exam.findOne({
      where: { 
        id: examId,
        userId: parseInt(userId)
      },
      include: [{
        model: ExamDetail,
        as: 'examDetails',
        include: [{
          model: Question,
          as: 'question',
          attributes: ['id', 'type', 'content', 'options', 'answer', 'analysis']
        }]
      }]
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: '考试记录不存在或无权访问'
      });
    }

    // 格式化考试结果数据
    const result = {
      score: exam.score,
      totalQuestions: exam.total_questions,
      correctCount: exam.correct_count,
      wrongCount: exam.wrong_count,
      answers: exam.examDetails.map(detail => {
        // 确保选项是JSON格式
        if (detail.question.type === 'single' || detail.question.type === 'multiple') {
          detail.question.options = typeof detail.question.options === 'string'
            ? JSON.parse(detail.question.options)
            : detail.question.options;
        }
        return {
          questionId: detail.questionId,
          question: detail.question,
          user_answer: detail.user_answer,
          is_correct: detail.is_correct
        };
      })
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取考试结果失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取错题本中的题目
router.get('/mistake-book/:bookId/questions', async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    // 检查错题本是否属于当前用户
    const book = await MistakeBook.findOne({
      where: { 
        id: bookId,
        userId: parseInt(userId)
      }
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: '错题本不存在或无权访问'
      });
    }
    
    const records = await MistakeRecord.findAll({
      where: { bookId },
      include: [{
        model: Question,
        as: 'question',
        attributes: ['id', 'type', 'content', 'options', 'answer', 'analysis']
      }]
    });
    
    const questions = records.map(record => ({
      ...record.question.toJSON(),
      errorCount: record.errorCount
    }));
    
    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: '获取题目失败'
    });
  }
});

// 提交错题练习
router.post('/mistake-practice/submit', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const { bookId, answers } = req.body;

    // 检查错题本是否属于当前用户
    const book = await MistakeBook.findOne({
      where: { 
        id: bookId,
        userId: parseInt(userId)
      }
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: '错题本不存在或无权访问'
      });
    }
    
    // 处理答案并计算分数
    const result = await processAnswers(answers);
    
    // 更新错误次数
    for (const detail of result.details) {
      if (!detail.isCorrect) {
        const record = await MistakeRecord.findOne({
          where: {
            bookId: bookId,
            questionId: detail.questionId
          }
        });
        
        if (record) {
          await record.update({
            errorCount: record.errorCount + 1
          }, { transaction: t });
        }
      }
    }
    
    await t.commit();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    await t.rollback();
    console.error('提交错题练习失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 添加错题记录
router.post('/mistake-record', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const { bookId, questionId } = req.body;
    
    if (!bookId || !questionId) {
      return res.status(400).json({
        success: false,
        message: '错题本ID和题目ID不能为空'
      });
    }

    // 检查错题本是否属于当前用户
    const mistakeBook = await MistakeBook.findOne({
      where: {
        id: bookId,
        userId: parseInt(userId)
      }
    });

    if (!mistakeBook) {
      return res.status(404).json({
        success: false,
        message: '错题本不存在或无权访问'
      });
    }

    // 检查题目是否已经在错题本中
    const existingRecord = await MistakeRecord.findOne({
      where: {
        bookId,
        questionId
      }
    });

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: '该题目已在错题本中'
      });
    }

    // 创建错题记录
    const mistakeRecord = await MistakeRecord.create({
      bookId,
      questionId
    });

    res.json({
      success: true,
      message: '添加成功',
      data: mistakeRecord
    });
  } catch (error) {
    console.error('添加错题记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

module.exports = router; 