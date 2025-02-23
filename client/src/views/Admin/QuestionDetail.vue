<template>
  <div class="question-detail">
    <a-card :bordered="false">
      <template #title>
        <div class="page-header">
          <a-space>
            <a-button @click="router.back()">
              <template #icon><arrow-left-outlined /></template>
              返回
            </a-button>
            <span class="page-title">题目管理</span>
          </a-space>
          <div class="header-actions">
            <a-button type="primary" @click="showCreateModal">
              <template #icon><plus-outlined /></template>
              添加题目
            </a-button>
          </div>
        </div>
      </template>

      <!-- 题库信息 -->
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="题库名称">{{ bankInfo.name }}</a-descriptions-item>
        <a-descriptions-item label="创建者">{{ bankInfo.creator?.username }}</a-descriptions-item>
        <a-descriptions-item label="题目数量">{{ bankInfo.questionCount || 0 }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">
          {{ bankInfo.create_time ? new Date(bankInfo.create_time).toLocaleString() : '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="描述" :span="2">{{ bankInfo.description || '-' }}</a-descriptions-item>
      </a-descriptions>

      <!-- 题目列表 -->
      <div class="questions-section">
        <h3>题目列表</h3>
        <a-table
          :columns="columns"
          :data-source="questions"
          :loading="loading"
          :pagination="{
            total: total,
            current: currentPage,
            pageSize: pageSize,
            onChange: handlePageChange,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条`
          }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'type'">
              <a-tag :color="getTypeColor(record.type)">{{ getTypeText(record.type) }}</a-tag>
            </template>
            <template v-if="column.key === 'action'">
              <a-space>
                <a-button type="link" @click="editQuestion(record)">编辑</a-button>
                <a-popconfirm
                  title="确定要删除这个题目吗？"
                  @confirm="deleteQuestion(record)"
                >
                  <a-button type="link" danger>删除</a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>
    </a-card>

    <!-- 创建/编辑题目对话框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="editingQuestion ? '编辑题目' : '添加题目'"
      width="800px"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form
        ref="formRef"
        :model="formState"
        :rules="rules"
        layout="vertical"
      >
        <a-form-item label="题目类型" name="type">
          <a-select v-model:value="formState.type">
            <a-select-option value="single">单选题</a-select-option>
            <a-select-option value="multiple">多选题</a-select-option>
            <a-select-option value="judge">判断题</a-select-option>
            <a-select-option value="essay">问答题</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="题目内容" name="content">
          <a-textarea v-model:value="formState.content" :rows="4" />
        </a-form-item>

        <template v-if="formState.type !== 'essay'">
          <a-form-item 
            v-if="formState.type !== 'judge'" 
            label="选项" 
            name="options"
          >
            <div v-for="(option, key) in formState.options" :key="key" class="option-item">
              <a-input
                v-model:value="formState.options[key]"
                :placeholder="`选项 ${key}`"
              >
                <template #addonBefore>{{ key }}</template>
              </a-input>
            </div>
          </a-form-item>

          <a-form-item label="正确答案" name="answer">
            <template v-if="formState.type === 'single'">
              <a-select v-model:value="formState.answer">
                <a-select-option v-for="(_, key) in formState.options" :key="key" :value="key">
                  {{ key }}
                </a-select-option>
              </a-select>
            </template>
            <template v-else-if="formState.type === 'multiple'">
              <a-select
                v-model:value="formState.answer"
                mode="multiple"
                placeholder="请选择正确答案"
              >
                <a-select-option v-for="(_, key) in formState.options" :key="key" :value="key">
                  {{ key }}
                </a-select-option>
              </a-select>
            </template>
            <template v-else-if="formState.type === 'judge'">
              <a-radio-group v-model:value="formState.answer">
                <a-radio :value="true">正确</a-radio>
                <a-radio :value="false">错误</a-radio>
              </a-radio-group>
            </template>
          </a-form-item>
        </template>

        <template v-else>
          <a-form-item label="参考答案" name="answer">
            <a-textarea v-model:value="formState.answer" :rows="4" />
          </a-form-item>
        </template>

        <a-form-item label="解析" name="analysis">
          <a-textarea v-model:value="formState.analysis" :rows="4" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import axios from 'axios';
import {
  ArrowLeftOutlined,
  PlusOutlined
} from '@ant-design/icons-vue';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const bankInfo = ref({});
const questions = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const modalVisible = ref(false);
const editingQuestion = ref(null);
const formRef = ref(null);

const formState = reactive({
  type: 'single',
  content: '',
  options: {
    A: '',
    B: '',
    C: '',
    D: ''
  },
  answer: '',
  analysis: ''
});

const rules = {
  type: [{ required: true, message: '请选择题目类型' }],
  content: [{ required: true, message: '请输入题目内容' }],
  answer: [{ required: true, message: '请设置正确答案' }]
};

const columns = [
  {
    title: '题目内容',
    dataIndex: 'content',
    key: 'content',
    ellipsis: true
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 100
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    key: 'create_time',
    width: 180,
    customRender: ({ text }) => new Date(text).toLocaleString()
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right'
  }
];

const getTypeColor = (type) => {
  const colors = {
    single: 'blue',
    multiple: 'green',
    judge: 'orange',
    essay: 'purple'
  };
  return colors[type] || 'default';
};

const getTypeText = (type) => {
  const texts = {
    single: '单选题',
    multiple: '多选题',
    judge: '判断题',
    essay: '问答题'
  };
  return texts[type] || type;
};

const fetchBankData = async () => {
  try {
    const bankId = route.params.id;
    const response = await axios.get(`/api/admin/question-banks/${bankId}`);
    if (response.data.success) {
      bankInfo.value = response.data.data;
    }
  } catch (error) {
    message.error('获取题库信息失败');
  }
};

const fetchQuestions = async () => {
  loading.value = true;
  try {
    const bankId = route.params.id;
    const response = await axios.get(`/api/admin/question-banks/${bankId}/questions`, {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value
      }
    });
    if (response.data.success) {
      questions.value = response.data.data.list.map(question => ({
        ...question,
        options: question.options ? JSON.parse(question.options) : null
      }));
      total.value = response.data.data.total;
    }
  } catch (error) {
    message.error('获取题目列表失败');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page, size) => {
  currentPage.value = page;
  pageSize.value = size;
  fetchQuestions();
};

const showCreateModal = () => {
  editingQuestion.value = null;
  formState.type = 'single';
  formState.content = '';
  formState.options = { A: '', B: '', C: '', D: '' };
  formState.answer = '';
  formState.analysis = '';
  modalVisible.value = true;
};

const editQuestion = (question) => {
  editingQuestion.value = question;
  formState.type = question.type;
  formState.content = question.content;
  formState.options = question.type === 'single' || question.type === 'multiple'
    ? question.options
    : { A: '', B: '', C: '', D: '' };
  formState.answer = question.answer;
  formState.analysis = question.analysis || '';
  modalVisible.value = true;
};

const handleModalOk = async () => {
  try {
    await formRef.value.validate();
    const bankId = route.params.id;
    const data = {
      ...formState,
      options: formState.type === 'judge' || formState.type === 'essay' ? null : formState.options
    };

    if (editingQuestion.value) {
      await axios.put(`/api/admin/questions/${editingQuestion.value.id}`, data);
      message.success('更新题目成功');
    } else {
      await axios.post(`/api/admin/question-banks/${bankId}/questions`, data);
      message.success('添加题目成功');
    }

    modalVisible.value = false;
    fetchQuestions();
  } catch (error) {
    if (error?.errorFields) {
      return;
    }
    message.error(editingQuestion.value ? '更新题目失败' : '添加题目失败');
  }
};

const handleModalCancel = () => {
  modalVisible.value = false;
};

const deleteQuestion = async (question) => {
  try {
    await axios.delete(`/api/admin/questions/${question.id}`);
    message.success('删除题目成功');
    fetchQuestions();
  } catch (error) {
    message.error('删除题目失败');
  }
};

onMounted(() => {
  fetchBankData();
  fetchQuestions();
});
</script>

<style scoped>
.question-detail {
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  font-size: 16px;
  font-weight: 500;
}

.questions-section {
  margin-top: 24px;
}

h3 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  color: #1f1f1f;
}

.option-item {
  margin-bottom: 8px;
}

.option-item:last-child {
  margin-bottom: 0;
}
</style> 