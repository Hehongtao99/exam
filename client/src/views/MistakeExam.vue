<template>
  <div class="mistake-exam-container">
    <!-- 练习模式 -->
    <div v-if="!showResult">
      <a-card :bordered="false">
        <template #title>
          <div class="exam-header">
            <span class="exam-title">错题练习</span>
            <a-space>
              <a-button @click="router.push('/dashboard/mistake-books')">
                返回错题本
              </a-button>
              <a-button type="primary" @click="handleSubmit" :disabled="!canSubmit">
                提交
              </a-button>
            </a-space>
          </div>
        </template>
        
        <div class="question-nav">
          <div class="nav-header">题目导航</div>
          <div class="nav-items">
            <a-button
              v-for="(_, index) in questions"
              :key="index"
              :type="currentIndex === index ? 'primary' : 'default'"
              shape="circle"
              size="small"
              :class="{ 'answered': answers[index] !== undefined && answers[index] !== '' }"
              @click="currentIndex = index"
            >
              {{ index + 1 }}
            </a-button>
          </div>
        </div>
        
        <div class="question-content">
          <div v-if="currentQuestion" class="question-wrapper">
            <div class="question-title">
              <div class="question-index">第 {{ currentIndex + 1 }}/{{ questions.length }} 题</div>
              <span class="question-type" :class="currentQuestion.type">
                {{ getQuestionType(currentQuestion.type) }}
              </span>
              <div class="question-text">{{ currentQuestion.content }}</div>
            </div>
            
            <div class="question-options" v-if="currentQuestion.type === 'single' || currentQuestion.type === 'multiple'">
              <a-checkbox-group 
                v-if="currentQuestion.type === 'multiple'"
                v-model:value="answers[currentIndex]"
                class="option-group"
              >
                <div v-for="(content, key) in currentQuestion.options" :key="key" class="option-item">
                  <a-checkbox :value="key">
                    <span class="option-label">{{ key }}.</span>
                    {{ content }}
                  </a-checkbox>
                </div>
              </a-checkbox-group>
              <a-radio-group
                v-else
                v-model:value="answers[currentIndex]"
                class="option-group"
              >
                <div v-for="(content, key) in currentQuestion.options" :key="key" class="option-item">
                  <a-radio :value="key">
                    <span class="option-label">{{ key }}.</span>
                    {{ content }}
                  </a-radio>
                </div>
              </a-radio-group>
            </div>
            
            <div class="question-options" v-else-if="currentQuestion.type === 'judge'">
              <a-radio-group v-model:value="answers[currentIndex]" class="judge-group">
                <a-radio :value="true">正确</a-radio>
                <a-radio :value="false">错误</a-radio>
              </a-radio-group>
            </div>
            
            <div class="question-options" v-else>
              <a-textarea
                v-model:value="answers[currentIndex]"
                :rows="6"
                placeholder="请输入你的答案"
                class="essay-input"
              />
            </div>

            <div class="question-actions">
              <a-space>
                <a-button 
                  @click="currentIndex = Math.max(0, currentIndex - 1)"
                  :disabled="currentIndex === 0"
                >上一题</a-button>
                <a-button 
                  type="primary"
                  @click="currentIndex = Math.min(questions.length - 1, currentIndex + 1)"
                  :disabled="currentIndex === questions.length - 1"
                >下一题</a-button>
              </a-space>
            </div>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 结果显示 -->
    <div v-else>
      <a-card :bordered="false">
        <template #title>
          <div class="header">
            <h2>练习结果</h2>
            <a-button @click="router.push('/dashboard/mistake-books')">
              返回错题本
            </a-button>
          </div>
        </template>
        
        <div class="result-overview">
          <a-row :gutter="16">
            <a-col :span="6">
              <div class="stat-card">
                <div class="stat-title">得分</div>
                <div class="stat-value" :class="{ 'pass': score >= 60, 'fail': score < 60 }">
                  {{ score }}
                </div>
              </div>
            </a-col>
            <a-col :span="6">
              <div class="stat-card">
                <div class="stat-title">总题数</div>
                <div class="stat-value">{{ totalQuestions }}</div>
              </div>
            </a-col>
            <a-col :span="6">
              <div class="stat-card">
                <div class="stat-title">正确题数</div>
                <div class="stat-value correct">{{ correctCount }}</div>
              </div>
            </a-col>
            <a-col :span="6">
              <div class="stat-card">
                <div class="stat-title">错误题数</div>
                <div class="stat-value wrong">{{ wrongCount }}</div>
              </div>
            </a-col>
          </a-row>
        </div>
        
        <div class="question-review">
          <div class="review-title">答题详情</div>
          <div class="question-list">
            <div v-for="(detail, index) in practiceDetails" :key="index" class="question-item">
              <div class="question-header">
                <div class="question-info">
                  <span class="question-index">第 {{ index + 1 }} 题</span>
                  <span class="question-type">{{ getQuestionType(questions[index].type) }}</span>
                  <span class="error-count">错误次数：{{ questions[index].errorCount }}</span>
                  <span :class="['status-tag', detail.isCorrect ? 'correct' : 'wrong']">
                    {{ detail.isCorrect ? '正确' : '错误' }}
                  </span>
                </div>
              </div>
              
              <div class="question-content">{{ questions[index].content }}</div>
              
              <div class="answer-section">
                <div class="answer-item">
                  <span class="answer-label">你的答案：</span>
                  <span :class="{ 'wrong-answer': !detail.isCorrect }">
                    {{ formatAnswer(detail.userAnswer, questions[index].options, questions[index].type) }}
                  </span>
                </div>
                <div class="answer-item" v-if="!detail.isCorrect">
                  <span class="answer-label">正确答案：</span>
                  <span class="correct-answer">
                    {{ formatAnswer(questions[index].answer, questions[index].options, questions[index].type) }}
                  </span>
                </div>
                <div class="answer-item" v-if="questions[index].analysis">
                  <span class="answer-label">解析：</span>
                  <span class="answer-analysis">{{ questions[index].analysis }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const questions = ref([])
const currentIndex = ref(0)
const answers = ref([])
const showResult = ref(false)
const score = ref(0)
const totalQuestions = ref(0)
const correctCount = ref(0)
const wrongCount = ref(0)
const practiceDetails = ref([])

const currentQuestion = computed(() => questions.value[currentIndex.value])

const canSubmit = computed(() => {
  return answers.value.every(answer => {
    if (answer === undefined || answer === '') return false;
    if (Array.isArray(answer) && answer.length === 0) return false;
    return true;
  });
})

const getQuestionType = (type) => {
  const types = {
    single: '单选题',
    multiple: '多选题',
    judge: '判断题',
    essay: '问答题'
  }
  return types[type] || '未知类型';
}

const parseOptions = (options) => {
  if (!options) return {};
  if (typeof options === 'string') {
    try {
      return JSON.parse(options);
    } catch (e) {
      console.error('选项解析错误:', e);
      return {};
    }
  }
  return options;
}

const handleSubmit = async () => {
  try {
    const examAnswers = questions.value.map((question, index) => {
      let answer = answers.value[index];
      
      switch (question.type) {
        case 'multiple':
          answer = Array.isArray(answer) ? answer.sort().join(',') : answer;
          break;
        case 'judge':
          answer = String(answer);
          break;
      }

      return {
        questionId: question.id,
        userAnswer: answer,
        type: question.type
      };
    });

    const response = await axios.post('/api/exams/mistake-practice/submit', {
      userId: 1,
      bookId: parseInt(route.params.bookId),
      answers: examAnswers
    });

    if (response.data.success) {
      const result = response.data.data;
      score.value = result.score;
      totalQuestions.value = result.totalQuestions;
      correctCount.value = result.correctCount;
      wrongCount.value = result.wrongCount;
      
      practiceDetails.value = result.details.map((detail, index) => {
        const question = questions.value[index];
        return {
          ...detail,
          question: {
            ...question,
            options: parseOptions(question.options)
          }
        };
      });
      
      showResult.value = true;
      
      await fetchQuestions();
    }
  } catch (error) {
    message.error('提交失败：' + (error.response?.data?.message || error.message));
  }
}

const formatAnswer = (answer, options, type) => {
  if (!answer || !options) return '';
  
  switch (type) {
    case 'single':
      return `${answer}.${options[answer] || ''}`;
    case 'multiple':
      return answer.split(',')
        .map(key => `${key}.${options[key] || ''}`)
        .filter(text => text.includes('.'))
        .join('、');
    case 'judge':
      return answer === 'true' ? '正确' : '错误';
    default:
      return answer;
  }
}

const fetchQuestions = async () => {
  try {
    const response = await axios.get(`/api/exams/mistake-book/${route.params.bookId}/questions`);
    if (response.data.success) {
      questions.value = response.data.data.map(question => ({
        ...question,
        options: parseOptions(question.options)
      }));
      answers.value = new Array(questions.value.length);
    }
  } catch (error) {
    message.error('获取错题失败');
    router.push('/dashboard/mistake-books');
  }
}

onMounted(() => {
  fetchQuestions();
})
</script>

<style scoped>
.mistake-exam-container {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 200px);
}

.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exam-title {
  font-size: 18px;
  font-weight: 500;
  color: #1f1f1f;
}

.question-nav {
  margin: 24px 0;
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.nav-header {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  color: #1f1f1f;
  text-align: center;
}

.nav-items {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 8px;
}

.nav-items .ant-btn {
  width: 32px;
  height: 32px;
  padding: 0;
}

.nav-items .answered {
  background-color: #e6f7ff;
  border-color: #91d5ff;
}

.question-content {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.question-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.question-title {
  margin-bottom: 24px;
}

.question-index {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.question-type {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 12px;
  font-size: 12px;
  margin-bottom: 12px;
}

.question-type.single { background: #e6f7ff; color: #1890ff; }
.question-type.multiple { background: #f6ffed; color: #52c41a; }
.question-type.judge { background: #fff7e6; color: #fa8c16; }
.question-type.essay { background: #f9f0ff; color: #722ed1; }

.question-text {
  font-size: 16px;
  line-height: 1.6;
  color: #1f1f1f;
  white-space: pre-wrap;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.option-item {
  padding: 12px 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  transition: all 0.3s;
}

.option-item:hover {
  background: #fafafa;
}

.option-label {
  display: inline-block;
  width: 24px;
  color: #666;
}

.judge-group {
  display: flex;
  gap: 24px;
  margin-top: 16px;
}

.essay-input {
  border-radius: 8px;
  resize: vertical;
}

.question-actions {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

/* 结果页样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h2 {
  margin: 0;
  font-size: 20px;
  color: #1f1f1f;
}

.result-overview {
  margin: 24px 0;
}

.stat-card {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.stat-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #1f1f1f;
}

.stat-value.pass { color: #52c41a; }
.stat-value.fail { color: #ff4d4f; }
.stat-value.correct { color: #52c41a; }
.stat-value.wrong { color: #ff4d4f; }

.question-review {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  margin-top: 24px;
}

.review-title {
  font-size: 16px;
  font-weight: 500;
  color: #1f1f1f;
  margin-bottom: 24px;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.question-item {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 20px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.question-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.error-count {
  background: #fff2f0;
  color: #ff4d4f;
  padding: 2px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.status-tag {
  padding: 2px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.status-tag.correct {
  background: #f6ffed;
  color: #52c41a;
}

.status-tag.wrong {
  background: #fff2f0;
  color: #ff4d4f;
}

.answer-section {
  background: #fafafa;
  padding: 16px;
  border-radius: 8px;
}

.answer-item {
  margin-bottom: 12px;
  line-height: 1.6;
}

.answer-item:last-child {
  margin-bottom: 0;
}

.answer-label {
  color: #666;
  margin-right: 8px;
  font-weight: 500;
}

.wrong-answer {
  color: #ff4d4f;
}

.correct-answer {
  color: #52c41a;
}

.answer-analysis {
  color: #666;
}

:deep(.ant-radio-wrapper),
:deep(.ant-checkbox-wrapper) {
  margin-bottom: 12px;
}
</style> 