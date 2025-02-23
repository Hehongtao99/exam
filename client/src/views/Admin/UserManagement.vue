<template>
  <div class="user-management">
    <a-card :bordered="false">
      <template #title>
        <div class="page-header">
          <span class="page-title">用户管理</span>
          <a-input-search
            v-model:value="searchKeyword"
            placeholder="搜索用户名或昵称"
            style="width: 300px"
            @search="handleSearch"
          />
        </div>
      </template>

      <a-table
        :columns="columns"
        :data-source="users"
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
          <template v-if="column.key === 'avatar'">
            <a-avatar :src="record.avatar">
              {{ record.nickname?.substring(0, 1) || record.username.substring(0, 1) }}
            </a-avatar>
          </template>
          
          <template v-if="column.key === 'role'">
            <a-tag :color="record.role === 'admin' ? 'red' : 'blue'">
              {{ record.role === 'admin' ? '管理员' : '普通用户' }}
            </a-tag>
          </template>

          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" @click="viewUserDetail(record)">
                查看详情
              </a-button>
              <a-button 
                type="link" 
                @click="handleRoleChange(record)"
                :disabled="record.id === currentUserId"
              >
                {{ record.role === 'admin' ? '取消管理员' : '设为管理员' }}
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import axios from 'axios';
import { useUserStore } from '../../store/user';

const router = useRouter();
const userStore = useUserStore();
const currentUserId = userStore.id;

const loading = ref(false);
const users = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const searchKeyword = ref('');

const columns = [
  {
    title: '头像',
    key: 'avatar',
    width: 80
  },
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username'
  },
  {
    title: '昵称',
    dataIndex: 'nickname',
    key: 'nickname'
  },
  {
    title: '角色',
    key: 'role'
  },
  {
    title: '注册时间',
    dataIndex: 'create_time',
    key: 'create_time',
    customRender: ({ text }) => new Date(text).toLocaleString()
  },
  {
    title: '操作',
    key: 'action',
    width: 200
  }
];

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/api/admin/users', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        keyword: searchKeyword.value
      }
    });
    
    if (response.data.success) {
      users.value = response.data.data.list;
      total.value = response.data.data.total;
    }
  } catch (error) {
    message.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchUsers();
};

const handlePageChange = (page, size) => {
  currentPage.value = page;
  pageSize.value = size;
  fetchUsers();
};

const viewUserDetail = (user) => {
  router.push(`/admin/users/${user.id}`);
};

const handleRoleChange = async (user) => {
  try {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    await axios.put(`/api/admin/users/${user.id}`, {
      role: newRole
    });
    
    message.success('更新角色成功');
    fetchUsers();
  } catch (error) {
    message.error('更新角色失败');
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.user-management {
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

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f5f5f5;
}
</style>