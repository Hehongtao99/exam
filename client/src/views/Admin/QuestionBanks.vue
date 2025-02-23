<template>
  <div class="question-banks-management">
    <a-card :bordered="false" class="main-card">
      <template #title>
        <div class="page-header flex justify-between items-center py-2">
          <span class="page-title text-2xl font-medium">题库管理</span>
          <div class="flex items-center space-x-4">
            <a-input-search
              v-model:value="searchKeyword"
              placeholder="搜索题库名称"
              class="w-72 transition-all hover:w-80"
              :allowClear="true"
              @search="handleSearch"
            >
              <template #prefix>
                <search-outlined />
              </template>
            </a-input-search>
            <a-button type="primary" @click="showCreateModal">
              <template #icon><plus-outlined /></template>
              新建题库
            </a-button>
          </div>
        </div>
      </template>

      <a-table
        :columns="columns"
        :data-source="questionBanks"
        :loading="loading"
        :scroll="{ x: '100%', y: 'calc(100vh - 350px)' }"
        :pagination="{
          total: total,
          current: currentPage,
          pageSize: pageSize,
          onChange: handlePageChange,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `共 ${total} 条`,
          class: 'my-6'
        }"
        :rowClassName="() => 'hover:bg-gray-50 transition-colors'"
        class="custom-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space size="middle">
              <a-button type="link" class="text-blue-500 hover:text-blue-600" @click="showQuestions(record)">
                <template #icon><eye-outlined /></template>
                查看题目
              </a-button>
              <a-button type="link" class="text-green-500 hover:text-green-600" @click="editQuestionBank(record)">
                <template #icon><edit-outlined /></template>
                编辑
              </a-button>
              <a-popconfirm
                title="确定要删除这个题库吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record)"
              >
                <a-button type="link" class="text-red-500 hover:text-red-600">
                  <template #icon><delete-outlined /></template>
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 创建/编辑题库对话框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="editingBank ? '编辑题库' : '新建题库'"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form
        ref="formRef"
        :model="formState"
        :rules="rules"
        layout="vertical"
      >
        <a-form-item label="题库名称" name="name">
          <a-input v-model:value="formState.name" placeholder="请输入题库名称" />
        </a-form-item>
        <a-form-item label="题库描述" name="description">
          <a-textarea v-model:value="formState.description" placeholder="请输入题库描述" :rows="4" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue';

const router = useRouter();
const loading = ref(false);
const questionBanks = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const searchKeyword = ref('');
const modalVisible = ref(false);
const editingBank = ref(null);
const formRef = ref(null);

const formState = ref({
  name: '',
  description: ''
});

const rules = {
  name: [{ required: true, message: '请输入题库名称' }],
  description: [{ required: true, message: '请输入题库描述' }]
};

const columns = [
  {
    title: '题库名称',
    dataIndex: 'name',
    key: 'name',
    width: 200
  },
  {
    title: '题目数量',
    dataIndex: 'questionCount',
    key: 'questionCount',
    width: 120
  },
  {
    title: '创建者',
    key: 'creator',
    width: 120,
    customRender: ({ record }) => record.creator?.nickname || record.creator?.username
  },
  {
    title: '创建时间',
    dataIndex: 'create_time',
    key: 'create_time',
    width: 180,
    customRender: ({ text }) => new Date(text).toLocaleString()
  },
  {
    title: '最后更新',
    dataIndex: 'update_time',
    key: 'update_time',
    width: 180,
    customRender: ({ text }) => new Date(text).toLocaleString()
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right'
  }
];

const fetchQuestionBanks = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/api/admin/question-banks', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        keyword: searchKeyword.value
      }
    });
    
    if (response.data.success) {
      questionBanks.value = response.data.data.list;
      total.value = response.data.data.total;
    }
  } catch (error) {
    message.error('获取题库列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchQuestionBanks();
};

const handlePageChange = (page, size) => {
  currentPage.value = page;
  pageSize.value = size;
  fetchQuestionBanks();
};

const showCreateModal = () => {
  editingBank.value = null;
  formState.value = {
    name: '',
    description: ''
  };
  modalVisible.value = true;
};

const editQuestionBank = (bank) => {
  editingBank.value = bank;
  formState.value = {
    name: bank.name,
    description: bank.description
  };
  modalVisible.value = true;
};

const handleModalOk = async () => {
  try {
    await formRef.value.validate();
    
    if (editingBank.value) {
      await axios.put(`/api/admin/question-banks/${editingBank.value.id}`, formState.value);
      message.success('更新题库成功');
    } else {
      await axios.post('/api/admin/question-banks', formState.value);
      message.success('创建题库成功');
    }
    
    modalVisible.value = false;
    fetchQuestionBanks();
  } catch (error) {
    if (error?.errorFields) {
      return;
    }
    message.error(editingBank.value ? '更新题库失败' : '创建题库失败');
  }
};

const handleModalCancel = () => {
  modalVisible.value = false;
};

const showQuestions = (bank) => {
  router.push(`/admin/question-banks/${bank.id}/questions`);
};

const handleDelete = async (bank) => {
  try {
    await axios.delete(`/api/admin/question-banks/${bank.id}`);
    message.success('删除成功');
    fetchQuestionBanks();
  } catch (error) {
    message.error('删除失败');
  }
};

onMounted(() => {
  fetchQuestionBanks();
});
</script>

<style scoped>
.question-banks-management {
  height: 100%;
  background-color: #fff;
  width: 100%;
  overflow-x: hidden;
  border-radius: 8px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
}

.main-card {
  border-radius: 8px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
}

.custom-table :deep(.ant-table-thead > tr > th) {
  background-color: #fafafa;
  padding: 16px 12px;
  font-weight: 500;
}

.custom-table :deep(.ant-table-tbody > tr > td) {
  padding: 16px 12px;
}

.custom-table :deep(.ant-table-row) {
  cursor: pointer;
}

/* 优化滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
  transition: all 0.2s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style> 