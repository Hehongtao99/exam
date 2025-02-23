<template>
  <div class="exam-container">
    <a-card :bordered="false" class="exam-card">
      <template #title>
        <div class="exam-header">
          <div class="exam-title">正在考试</div>
          <div class="exam-info">
            <a-space>
              <a-tag color="blue">
                <template #icon>
                  <span class="anticon">
                    <svg viewBox="64 64 896 896" focusable="false" data-icon="clock-circle" width="1em" height="1em" fill="currentColor"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"></path></svg>
                  </span>
                </template>
                剩余时间：{{ formatTime(remainingTime) }}
              </a-tag>
              <a-button type="primary" @click="handleSubmit" :disabled="!canSubmit">
                交卷
              </a-button>
            </a-space>
          </div>
        </div>
      </template>
      
      <div class="question-list">
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
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const questions = ref([])
const currentIndex = ref(0)
const answers = ref([])
const remainingTime = ref(60 * 60) // 默认1小时
const timer = ref(null)

// 获取考试配置
const examConfig = ref(JSON.parse(localStorage.getItem('examConfig') || '{}'))

const currentQuestion = computed(() => questions.value[currentIndex.value])

const canSubmit = computed(() => {
  return answers.value.every(answer => {
    if (Array.isArray(answer)) {
      return answer.length > 0
    }
    return answer !== undefined && answer !== ''
  })
})

const getQuestionType = (type) => {
  const types = {
    single: '单选题',
    multiple: '多选题',
    judge: '判断题',
    essay: '问答题'
  }
  return types[type]
}

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const startTimer = () => {
  timer.value = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--
    } else {
      clearInterval(timer.value)
      handleSubmit()
    }
  }, 1000)
}

const handleSubmit = async () => {
  try {
    const response = await axios.post('/api/exams/submit', {
      userId: 1, // 这里应该从登录状态中获取
      bankId: route.params.bankId,
      answers: questions.value.map((question, index) => {
        let answer = answers.value[index];
        // 如果是多选题，将数组转换为逗号分隔的字符串
        if (question.type === 'multiple' && Array.isArray(answer)) {
          answer = answer.sort().join(',');
        }
        return {
          questionId: question.id,
          userAnswer: answer,
          type: question.type
        };
      })
    });
    
    if (response.data.success) {
      message.success('提交成功');
      router.push(`/dashboard/exam-result/${response.data.data.examId}`);
    }
  } catch (error) {
    message.error('提交失败');
  }
};

onMounted(async () => {
  try {
    const response = await axios.get(`/api/exams/start/${route.params.bankId}`)
    if (response.data.success) {
      let questionList = response.data.data
      
      // 如果配置了题目数量限制
      if (examConfig.value.questionCount && examConfig.value.questionCount < questionList.length) {
        // 如果是随机出题
        if (examConfig.value.isRandom) {
          questionList = questionList.sort(() => Math.random() - 0.5)
        }
        questionList = questionList.slice(0, examConfig.value.questionCount)
      }
      
      questions.value = questionList
      answers.value = new Array(questions.value.length)
      
      // 设置考试时长
      if (examConfig.value.duration) {
        remainingTime.value = examConfig.value.duration * 60
      }
      
      startTimer()
    }
  } catch (error) {
    message.error('获取题目失败')
  }
})

onBeforeUnmount(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
  // 清除考试配置
  localStorage.removeItem('examConfig')
})
</script>

<style scoped>
.exam-container {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 200px);
}

.exam-card {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
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

.question-list {
  display: flex;
  gap: 24px;
  margin-top: 24px;
}

.question-nav {
  width: 200px;
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
  grid-template-columns: repeat(4, 1fr);
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
  flex: 1;
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

:deep(.ant-radio-wrapper),
:deep(.ant-checkbox-wrapper) {
  width: 100%;
  margin: 0;
}
</style> 