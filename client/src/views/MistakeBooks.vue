<template>
  <div class="mistake-books-container">
    <a-card :bordered="false">
      <template #title>
        <div class="page-header">
          <span class="page-title">错题本</span>
          <a-button type="primary" @click="showCreateModal">
            新建错题本
          </a-button>
        </div>
      </template>
      
      <a-row :gutter="[16, 16]">
        <a-col :span="8" v-for="book in mistakeBooks" :key="book.id">
          <a-card hoverable @click="viewBookDetail(book.id)">
            <template #title>
              <div class="book-header">
                <span class="book-title">{{ book.name }}</span>
                <a-tag>{{ book.records?.length || 0 }}题</a-tag>
              </div>
            </template>
            <template #extra>
              <a-space>
                <a-button type="link" @click.stop="startPractice(book.id)">
                  开始练习
                </a-button>
              </a-space>
            </template>
            
            <div class="book-content">
              <p class="book-description">{{ book.description || '暂无描述' }}</p>
              <div class="book-info">
                <span>创建时间：{{ formatDate(book.create_time) }}</span>
              </div>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </a-card>
    
    <a-modal
      v-model:open="modalVisible"
      title="新建错题本"
      @ok="handleCreate"
    >
      <a-form :model="form">
        <a-form-item label="错题本名称">
          <a-input v-model:value="form.name" placeholder="请输入错题本名称" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="form.description" placeholder="请输入描述" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import axios from 'axios'
import { useUserStore } from '../store/user'

const router = useRouter()
const userStore = useUserStore()
const mistakeBooks = ref([])
const modalVisible = ref(false)
const form = ref({
  name: '',
  description: ''
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const showCreateModal = () => {
  modalVisible.value = true
}

const handleCreate = async () => {
  try {
    const response = await axios.post('/api/exams/mistake-book', {
      userId: userStore.id,
      name: form.value.name,
      description: form.value.description
    })
    
    if (response.data.success) {
      message.success('创建成功')
      modalVisible.value = false
      form.value = { name: '', description: '' }
      fetchMistakeBooks()
    }
  } catch (error) {
    message.error('创建失败')
  }
}

const startPractice = (bookId) => {
  router.push(`/dashboard/mistake-exam/${bookId}`)
}

const viewBookDetail = (bookId) => {
  router.push(`/dashboard/mistake-books/${bookId}`)
}

const fetchMistakeBooks = async () => {
  try {
    const response = await axios.get('/api/exams/mistake-book/list')
    if (response.data.success) {
      console.log('Received mistake books:', response.data.data);
      mistakeBooks.value = response.data.data;
    }
  } catch (error) {
    message.error('获取错题本列表失败')
  }
}

onMounted(() => {
  fetchMistakeBooks()
})
</script>

<style scoped>
.mistake-books-container {
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

.book-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.book-title {
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-content {
  min-height: 100px;
}

.book-description {
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 16px;
}

.book-info {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
}
</style> 