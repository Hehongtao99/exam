<template>
  <div class="exam-manage-container">
    <a-card :bordered="false">
      <template #title>
        <div class="page-header">
          <span class="page-title">考试管理</span>
          <a-button type="primary" @click="showCreateModal">
            创建考试
          </a-button>
        </div>
      </template>

      <a-table
        :columns="columns"
        :data-source="questionBanks"
        :loading="loading"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" @click="startExam(record)">
                开始考试
              </a-button>
              <a-button type="link" @click="showExamHistory(record)">
                考试记录
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:visible="modalVisible"
      title="考试配置"
      @ok="handleCreateExam"
    >
      <a-form :model="examConfig" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="题库">
          <a-select v-model:value="examConfig.bankId" placeholder="请选择题库">
            <a-select-option v-for="bank in questionBanks" :key="bank.id" :value="bank.id">
              {{ bank.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="题目数量">
          <a-input-number v-model:value="examConfig.questionCount" :min="1" :max="maxQuestions" />
        </a-form-item>
        <a-form-item label="考试时长(分钟)">
          <a-input-number v-model:value="examConfig.duration" :min="1" :max="180" />
        </a-form-item>
        <a-form-item label="题目顺序">
          <a-radio-group v-model:value="examConfig.isRandom">
            <a-radio :value="false">顺序出题</a-radio>
            <a-radio :value="true">随机出题</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:visible="historyVisible"
      title="考试记录"
      width="800px"
    >
      <a-table
        :columns="historyColumns"
        :data-source="examHistory"
        :loading="historyLoading"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'score'">
            <span :style="{ color: record.score >= 60 ? '#52c41a' : '#f5222d' }">
              {{ record.score }}
            </span>
          </template>
          <template v-if="column.key === 'action'">
            <a-button type="link" @click="viewExamResult(record)">
              查看详情
            </a-button>
          </template>
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import axios from 'axios'

const router = useRouter()
const loading = ref(false)
const modalVisible = ref(false)
const historyVisible = ref(false)
const historyLoading = ref(false)
const questionBanks = ref([])
const examHistory = ref([])
const maxQuestions = ref(0)

const examConfig = ref({
  bankId: undefined,
  questionCount: 10,
  duration: 60,
  isRandom: true
})

const columns = [
  {
    title: '题库名称',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '题目数量',
    dataIndex: 'questionCount',
    key: 'questionCount'
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    key: 'create_time',
    render: (text) => new Date(text).toLocaleString()
  },
  {
    title: '操作',
    key: 'action'
  }
]

const historyColumns = [
  {
    title: '考试时间',
    dataIndex: 'create_time',
    key: 'create_time',
    render: (text) => new Date(text).toLocaleString()
  },
  {
    title: '得分',
    dataIndex: 'score',
    key: 'score'
  },
  {
    title: '总题数',
    dataIndex: 'total_questions',
    key: 'total_questions'
  },
  {
    title: '正确数',
    dataIndex: 'correct_count',
    key: 'correct_count'
  },
  {
    title: '错误数',
    dataIndex: 'wrong_count',
    key: 'wrong_count'
  },
  {
    title: '操作',
    key: 'action'
  }
]

const showCreateModal = () => {
  modalVisible.value = true
}

const handleCreateExam = () => {
  if (!examConfig.value.bankId) {
    message.warning('请选择题库')
    return
  }
  
  // 将考试配置保存到 localStorage
  localStorage.setItem('examConfig', JSON.stringify(examConfig.value))
  router.push(`/dashboard/exam/${examConfig.value.bankId}`)
  modalVisible.value = false
}

const startExam = (record) => {
  examConfig.value.bankId = record.id
  modalVisible.value = true
}

const showExamHistory = async (record) => {
  historyLoading.value = true
  historyVisible.value = true
  
  try {
    const response = await axios.get(`/api/exams/history/1?bankId=${record.id}`) // 这里应该从登录状态中获取用户ID
    if (response.data.success) {
      examHistory.value = response.data.data
    }
  } catch (error) {
    message.error('获取考试记录失败')
  } finally {
    historyLoading.value = false
  }
}

const viewExamResult = (record) => {
  router.push(`/dashboard/exam-result/${record.id}`)
}

const fetchQuestionBanks = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/question-banks')
    if (response.data.success) {
      questionBanks.value = response.data.data.map(bank => ({
        ...bank,
        questionCount: bank.Questions?.length || 0
      }))
    }
  } catch (error) {
    message.error('获取题库列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchQuestionBanks()
})
</script>

<style scoped>
.exam-manage-container {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 200px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 16px;
  font-weight: 500;
}
</style> 