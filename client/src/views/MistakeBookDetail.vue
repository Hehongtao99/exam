<template>
  <div class="mistake-book-detail">
    <div class="page-header">
      <a-button class="back-button" @click="goBack">
        <template #icon><left-outlined /></template>
        返回错题本
      </a-button>
    </div>

    <div v-if="book" class="book-info">
      <h2>{{ book.name }}</h2>
      <p v-if="book.description" class="description">{{ book.description }}</p>
      <div class="stats">
        <span>共 {{ questions.length }} 道错题</span>
      </div>
    </div>

    <div class="questions-list">
      <div v-for="(question, index) in questions" :key="question.id" class="question-card">
        <div class="question-header">
          <span class="question-index">第 {{ index + 1 }} 题</span>
          <span class="question-type">
            {{ getQuestionType(question.type) }}
          </span>
          <span class="error-count">错误次数：{{ question.errorCount }}</span>
        </div>

        <div class="question-content">
          <div class="question-text">{{ question.content }}</div>
          
          <!-- 选项（单选题和多选题） -->
          <div v-if="['single', 'multiple'].includes(question.type)" class="options">
            <div v-for="(option, key) in question.options" :key="key" class="option">
              <span class="option-key">{{ key }}.</span>
              <span class="option-content">{{ option }}</span>
            </div>
          </div>

          <div class="answer-section">
            <div class="correct-answer">
              <strong>正确答案：</strong>
              <span>{{ question.answer }}</span>
            </div>
            <div v-if="question.analysis" class="analysis">
              <strong>解析：</strong>
              <span>{{ question.analysis }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LeftOutlined } from '@ant-design/icons-vue';
import axios from 'axios';

export default {
  name: 'MistakeBookDetail',
  components: {
    LeftOutlined
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const book = ref(null);
    const questions = ref([]);

    const goBack = () => {
      router.push('/dashboard/mistake-books');
    };

    const getQuestionType = (type) => {
      const types = {
        single: '单选题',
        multiple: '多选题',
        judge: '判断题',
        essay: '问答题'
      };
      return types[type] || type;
    };

    const fetchMistakeBookDetails = async () => {
      try {
        const bookId = route.params.id;
        const response = await axios.get(`/api/exams/mistake-book/${bookId}/questions`);
        if (response.data.success) {
          book.value = response.data.data.book;
          questions.value = response.data.data.questions;
        }
      } catch (error) {
        console.error('获取错题本详情失败:', error);
      }
    };

    onMounted(() => {
      fetchMistakeBookDetails();
    });

    return {
      book,
      questions,
      getQuestionType,
      goBack
    };
  }
};
</script>

<style scoped>
.mistake-book-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
}

.book-info {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.book-info h2 {
  margin: 0 0 10px 0;
  color: #333;
}

.description {
  color: #666;
  margin: 10px 0;
}

.stats {
  color: #666;
  font-size: 0.9em;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-card {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.question-type {
  background-color: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.error-count {
  color: #dc3545;
}

.question-content {
  margin-top: 15px;
}

.question-text {
  font-size: 1.1em;
  margin-bottom: 15px;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 15px 0;
}

.option {
  display: flex;
  gap: 8px;
}

.option-key {
  font-weight: bold;
  min-width: 20px;
}

.answer-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px dashed #dee2e6;
}

.correct-answer, .analysis {
  margin: 10px 0;
}

.correct-answer strong, .analysis strong {
  color: #495057;
  margin-right: 8px;
}
</style> 