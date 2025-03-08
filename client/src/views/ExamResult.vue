<template>
  <div class="result-container">
    <a-card :bordered="false">
      <template #title>
        <div class="header">
          <h2>考试结果</h2>
          <a-space>
            <a-button type="primary" @click="handleAddToMistakeBook" v-if="selectedQuestions.length > 0">
              添加到错题本(已选择 {{ selectedQuestions.length }} 题)
            </a-button>
            <a-button @click="handleBack">
              返回题库
            </a-button>
          </a-space>
        </div>
      </template>
      
      <div class="result-overview">
        <a-row :gutter="16">
          <a-col :span="6">
            <div class="stat-card">
              <div class="stat-title">得分</div>
              <div class="stat-value" :class="{ 'pass': examData.score >= 60, 'fail': examData.score < 60 }">
                {{ examData.score }}
              </div>
            </div>
          </a-col>
          <a-col :span="6">
            <div class="stat-card">
              <div class="stat-title">总题数</div>
              <div class="stat-value">{{ examData.totalQuestions }}</div>
            </div>
          </a-col>
          <a-col :span="6">
            <div class="stat-card">
              <div class="stat-title">正确题数</div>
              <div class="stat-value correct">{{ examData.correctCount }}</div>
            </div>
          </a-col>
          <a-col :span="6">
            <div class="stat-card">
              <div class="stat-title">错误题数</div>
              <div class="stat-value wrong">{{ examData.wrongCount }}</div>
            </div>
          </a-col>
        </a-row>
      </div>
      
      <div class="question-review">
        <div class="review-title">
          <span>答题详情</span>
          <a-space>
            <a-button type="link" @click="handleSelectAll">全选错题</a-button>
            <a-button type="link" @click="handleClearSelection">清除选择</a-button>
          </a-space>
        </div>
        <div class="question-list">
          <div v-for="(record, index) in examData.answers" :key="index" class="question-item">
            <div class="question-header">
              <div class="question-info">
                <a-checkbox 
                  v-if="!record.is_correct"
                  v-model:checked="record.selected"
                  @change="handleQuestionSelect(record)"
                />
                <span class="question-index">第 {{ index + 1 }} 题</span>
                <span class="question-type">{{ getQuestionTypeName(record.question?.type) }}</span>
                <span :class="['status-tag', record.is_correct ? 'correct' : 'wrong']">
                  {{ record.is_correct ? '正确' : '错误' }}
                </span>
              </div>
            </div>
            
            <div class="question-content">{{ record.question?.content }}</div>
            
            <div class="answer-section">
              <div class="answer-item">
                <span class="answer-label">你的答案：</span>
                <span :class="{ 'wrong-answer': !record.is_correct }">
                  <template v-if="record.question.type === 'single'">
                    {{ formatSingleAnswer(record.user_answer, record.question.options) }}
                  </template>
                  <template v-else-if="record.question.type === 'multiple'">
                    {{ formatMultipleAnswer(record.user_answer, record.question.options) }}
                  </template>
                  <template v-else-if="record.question.type === 'judge'">
                    {{ record.user_answer === 'true' ? '正确' : '错误' }}
                  </template>
                  <template v-else>
                    {{ record.user_answer }}
                  </template>
                </span>
              </div>
              <div class="answer-item" v-if="!record.is_correct">
                <span class="answer-label">正确答案：</span>
                <span class="correct-answer">
                  <template v-if="record.question.type === 'single'">
                    {{ formatSingleAnswer(record.question.answer, record.question.options) }}
                  </template>
                  <template v-else-if="record.question.type === 'multiple'">
                    {{ formatMultipleAnswer(record.question.answer, record.question.options) }}
                  </template>
                  <template v-else-if="record.question.type === 'judge'">
                    {{ record.question.answer === 'true' ? '正确' : '错误' }}
                  </template>
                  <template v-else>
                    {{ record.question.answer }}
                  </template>
                </span>
              </div>
              <div class="answer-item" v-if="record.question?.analysis">
                <span class="answer-label">解析：</span>
                <span class="answer-analysis">{{ record.question.analysis }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-card>
    
    <a-modal
      v-model:open="modalVisible"
      title="添加到错题本"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form :model="formData" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
        <a-form-item label="错题本">
          <a-select
            v-model:value="formData.bookId"
            placeholder="请选择错题本"
            style="width: 100%"
          >
            <a-select-option value="new">创建新错题本</a-select-option>
            <a-select-option 
              v-for="book in mistakeBooks" 
              :key="book.id" 
              :value="book.id"
            >
              {{ book.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <template v-if="formData.bookId === 'new'">
          <a-form-item label="名称" required>
            <a-input v-model:value="formData.name" placeholder="请输入错题本名称" />
          </a-form-item>
          <a-form-item label="描述">
            <a-textarea v-model:value="formData.description" placeholder="请输入错题本描述" :rows="4" />
          </a-form-item>
        </template>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const modalVisible = ref(false)
const selectedQuestions = ref([])
const mistakeBooks = ref([])

const examData = ref({
  score: 0,
  totalQuestions: 0,
  correctCount: 0,
  wrongCount: 0,
  answers: []
})

const formData = ref({
  bookId: undefined,
  name: '',
  description: ''
})

const getQuestionTypeName = (type) => {
  const types = {
    'single': '单选题',
    'multiple': '多选题',
    'true_false': '判断题',
    'essay': '问答题'
  }
  return types[type] || '未知类型'
}

const handleBack = () => {
  router.push('/dashboard/question-banks')
}

const handleAddToMistakeBook = () => {
  if (selectedQuestions.value.length === 0) {
    message.warning('请至少选择一道题目')
    return
  }
  modalVisible.value = true
}

const handleQuestionSelect = (record) => {
  if (record.selected) {
    selectedQuestions.value.push(record.question.id)
  } else {
    const index = selectedQuestions.value.indexOf(record.question.id)
    if (index > -1) {
      selectedQuestions.value.splice(index, 1)
    }
  }
}

const handleSelectAll = () => {
  examData.value.answers.forEach(record => {
    if (!record.is_correct) {
      record.selected = true
      if (!selectedQuestions.value.includes(record.question.id)) {
        selectedQuestions.value.push(record.question.id)
      }
    }
  })
}

const handleClearSelection = () => {
  examData.value.answers.forEach(record => {
    record.selected = false
  })
  selectedQuestions.value = []
}

const handleModalOk = async () => {
  try {
    if (formData.value.bookId === 'new') {
      if (!formData.value.name) {
        message.error('请输入错题本名称')
        return
      }

      // 创建新错题本
      const createBookRes = await axios.post('/api/exams/mistake-book', {
        userId: 1, // 这里应该从登录状态中获取
        name: formData.value.name,
        description: formData.value.description
      })

      if (createBookRes.data.success) {
        formData.value.bookId = createBookRes.data.data.id
      } else {
        throw new Error('创建错题本失败')
      }
    }

    // 添加错题到错题本
    const addQuestionsRes = await axios.post('/api/exams/mistake-book/add', {
      bookId: formData.value.bookId,
      questionIds: selectedQuestions.value
    })

    if (addQuestionsRes.data.success) {
      message.success('添加成功')
      modalVisible.value = false
      // 不再跳转,让用户继续查看结果
      // router.push('/dashboard/mistake-books')
    }
  } catch (error) {
    message.error('操作失败：' + (error.response?.data?.message || error.message))
  }
}

const handleModalCancel = () => {
  modalVisible.value = false
  formData.value = {
    bookId: undefined,
    name: '',
    description: ''
  }
}

const fetchExamResult = async () => {
  try {
    const examId = route.params.examId
    const res = await axios.get(`/api/exams/${examId}/result`)
    if (res.data.success) {
      examData.value = res.data.data
      // 为每个答案添加选择状态
      examData.value.answers.forEach(answer => {
        answer.selected = false
        // 确保选项是对象格式
        if (answer.question.type === 'single' || answer.question.type === 'multiple') {
          answer.question.options = typeof answer.question.options === 'string'
            ? JSON.parse(answer.question.options)
            : answer.question.options
        }
      })
    } else {
      message.error(res.data.message || '获取考试结果失败')
      router.push('/dashboard/exams')
    }
  } catch (error) {
    console.error('获取考试结果失败:', error)
    message.error('获取考试结果失败，请稍后重试')
    router.push('/dashboard/exams')
  }
}

const fetchMistakeBooks = async () => {
  try {
    const response = await axios.get('/api/exams/mistake-book/1') // 这里应该从登录状态中获取用户ID
    if (response.data.success) {
      mistakeBooks.value = response.data.data
    }
  } catch (error) {
    message.error('获取错题本列表失败')
  }
}

const formatSingleAnswer = (answer, options) => {
  if (!answer || !options) return '';
  return `${answer}.${options[answer]}`;
};

const formatMultipleAnswer = (answer, options) => {
  if (!answer || !options) return '';
  return answer.split(',').map(key => `${key}.${options[key]}`).join('、');
};

onMounted(() => {
  fetchExamResult()
  fetchMistakeBooks()
})
</script>

<style scoped>
.result-container {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 200px);
}

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
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  color: #1f1f1f;
  margin-bottom: 24px;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-height: calc(100vh - 450px);
  overflow-y: auto;
  padding-right: 16px;
}

.question-list::-webkit-scrollbar {
  width: 6px;
}

.question-list::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 3px;
}

.question-list::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.question-list::-webkit-scrollbar-thumb:hover {
  background: #999;
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

.question-index {
  font-weight: 500;
  color: #1f1f1f;
}

.question-type {
  background: #f5f5f5;
  padding: 2px 12px;
  border-radius: 12px;
  font-size: 12px;
  color: #666;
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

.question-content {
  font-size: 15px;
  line-height: 1.6;
  color: #1f1f1f;
  margin-bottom: 16px;
  white-space: pre-wrap;
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

:deep(.ant-checkbox-wrapper) {
  margin-right: 0;
}
</style> 