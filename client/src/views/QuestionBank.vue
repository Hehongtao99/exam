<template>
  <div class="question-bank-container">
    <div class="header">
      <h2>题库管理</h2>
      <a-button type="primary" @click="showCreateModal">
        创建题库
      </a-button>
    </div>

    <a-table 
      :columns="columns" 
      :data-source="questionBanks" 
      :loading="loading"
      :pagination="{ 
        showQuickJumper: true,
        showSizeChanger: true,
        showTotal: total => `共 ${total} 条`,
        pageSize: 10
      }"
      :row-key="record => record.id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name'">
          <a @click="handleViewQuestions(record)">{{ record.name }}</a>
        </template>
        <template v-if="column.key === 'questionCount'">
          <a-tag :color="record.questionCount > 0 ? 'blue' : 'orange'">
            {{ record.questionCount }} 题
          </a-tag>
        </template>
        <template v-if="column.key === 'description'">
          <span>{{ record.description || '-' }}</span>
        </template>
        <template v-if="column.key === 'create_time'">
          <span>{{ new Date(record.create_time).toLocaleString() }}</span>
        </template>
        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="primary" @click="startExam(record)" :disabled="record.questionCount === 0">
              开始考试
            </a-button>
            <a-button type="link" @click="handleEdit(record)">编辑</a-button>
            <a-button type="link" @click="handleViewQuestions(record)">查看题目</a-button>
            <a-popconfirm
              title="确定要删除这个题库吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleDelete(record)"
            >
              <a-button type="link" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 创建/编辑题库对话框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      :maskClosable="false"
    >
      <a-form :model="formData" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
        <a-form-item label="名称" required>
          <a-input v-model:value="formData.name" placeholder="请输入题库名称" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="formData.description" placeholder="请输入题库描述" :rows="4" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 考试配置对话框 -->
    <a-modal
      v-model:open="examModalVisible"
      title="考试配置"
      @ok="handleStartExam"
      @cancel="examModalVisible = false"
      :maskClosable="false"
    >
      <a-form :model="examConfig" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="题目数量">
          <a-input-number 
            v-model:value="examConfig.questionCount" 
            :min="1" 
            :max="selectedBank?.questions?.length || 999"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="考试时长(分钟)">
          <a-input-number 
            v-model:value="examConfig.duration" 
            :min="1" 
            :max="180"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="题目顺序">
          <a-radio-group v-model:value="examConfig.isRandom">
            <a-radio :value="false">顺序出题</a-radio>
            <a-radio :value="true">随机出题</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const questionBanks = ref([])
const modalVisible = ref(false)
const examModalVisible = ref(false)
const modalTitle = ref('创建题库')
const selectedBank = ref(null)
const formData = ref({
  id: null,
  name: '',
  description: ''
})

const examConfig = ref({
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
    key: 'questionCount',
    customRender: ({ record }) => record.questions?.length || 0
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    customRender: ({ text }) => text || '-'
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    key: 'create_time',
    customRender: ({ text }) => new Date(text).toLocaleString()
  },
  {
    title: '操作',
    key: 'action',
    width: 300
  }
]

// 开始考试
const startExam = (record) => {
  selectedBank.value = record
  examConfig.value.questionCount = record.questions?.length || 10
  examModalVisible.value = true
}

// 处理开始考试
const handleStartExam = () => {
  if (!selectedBank.value) return
  
  // 保存考试配置
  const config = {
    bankId: selectedBank.value.id,
    ...examConfig.value
  }
  localStorage.setItem('examConfig', JSON.stringify(config))
  
  // 跳转到考试页面
  router.push(`/dashboard/exam/${selectedBank.value.id}`)
  examModalVisible.value = false
}

// 获取题库列表
const fetchQuestionBanks = async () => {
  try {
    loading.value = true
    const response = await axios.get('/api/question-banks')
    if (response.data.success) {
      questionBanks.value = response.data.data.map(bank => ({
        ...bank,
        questionCount: bank.questions?.length || 0
      }))
    }
  } catch (error) {
    message.error('获取题库列表失败')
  } finally {
    loading.value = false
  }
}

// 显示创建对话框
const showCreateModal = () => {
  modalTitle.value = '创建题库'
  formData.value = {
    id: null,
    name: '',
    description: ''
  }
  modalVisible.value = true
}

// 处理编辑
const handleEdit = (record) => {
  modalTitle.value = '编辑题库'
  formData.value = {
    id: record.id,
    name: record.name,
    description: record.description
  }
  modalVisible.value = true
}

// 处理查看题目
const handleViewQuestions = (record) => {
  router.push(`/dashboard/question-banks/${record.id}/questions`)
}

// 处理删除
const handleDelete = async (record) => {
  try {
    const res = await axios.delete(`/api/question-banks/${record.id}`)
    if (res.data.success) {
      message.success('删除成功')
      await fetchQuestionBanks()
    }
  } catch (error) {
    message.error('删除失败')
  }
}

// 处理对话框确认
const handleModalOk = async () => {
  try {
    if (!formData.value.name) {
      message.error('请输入题库名称')
      return
    }

    const userId = 1 // 这里应该从登录状态中获取
    const data = {
      name: formData.value.name,
      description: formData.value.description,
      userId
    }

    let res
    if (formData.value.id) {
      res = await axios.put(`/api/question-banks/${formData.value.id}`, data)
    } else {
      res = await axios.post('/api/question-banks', data)
    }

    if (res.data.success) {
      message.success(formData.value.id ? '更新成功' : '创建成功')
      modalVisible.value = false
      await fetchQuestionBanks()
    }
  } catch (error) {
    message.error(formData.value.id ? '更新失败' : '创建失败')
  }
}

// 处理对话框取消
const handleModalCancel = () => {
  modalVisible.value = false
}

onMounted(() => {
  fetchQuestionBanks()
})
</script>

<style scoped>
.question-bank-container {
  background: #fff;
  border-radius: 4px;
  padding: 24px;
  min-height: calc(100vh - 180px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  color: #1f1f1f;
}

:deep(.ant-table) {
  background: #fff;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f5f5f5;
}

:deep(.ant-table-row) {
  cursor: pointer;
}

:deep(.ant-btn-link) {
  padding: 4px 8px;
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
}

:deep(.ant-tag) {
  min-width: 60px;
  text-align: center;
}
</style> 