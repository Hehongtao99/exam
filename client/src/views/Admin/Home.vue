<template>
  <div class="admin-home">
    <a-row :gutter="[16, 16]">
      <!-- 统计卡片 -->
      <a-col :span="6">
        <a-card>
          <template #title>
            <span>
              <UserOutlined style="margin-right: 8px;" />
              总用户数
            </span>
          </template>
          <div class="stat-number">{{ stats.userCount }}</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <template #title>
            <span>
              <BookOutlined style="margin-right: 8px;" />
              总题库数
            </span>
          </template>
          <div class="stat-number">{{ stats.bankCount }}</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <template #title>
            <span>
              <FormOutlined style="margin-right: 8px;" />
              总考试次数
            </span>
          </template>
          <div class="stat-number">{{ stats.examCount }}</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <template #title>
            <span>
              <TrophyOutlined style="margin-right: 8px;" />
              平均分数
            </span>
          </template>
          <div class="stat-number">{{ stats.avgScore }}</div>
        </a-card>
      </a-col>

      <!-- 最近注册用户 -->
      <a-col :span="12">
        <a-card title="最近注册用户">
          <a-table
            :columns="userColumns"
            :data-source="recentUsers"
            :pagination="false"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'avatar'">
                <a-avatar :src="record.avatar">
                  {{ record.nickname?.substring(0, 1) || record.username.substring(0, 1) }}
                </a-avatar>
              </template>
              <template v-if="column.key === 'action'">
                <a-button type="link" @click="viewUserDetail(record)">
                  查看详情
                </a-button>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>

      <!-- 最近考试记录 -->
      <a-col :span="12">
        <a-card title="最近考试记录">
          <a-table
            :columns="examColumns"
            :data-source="recentExams"
            :pagination="false"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'score'">
                <span :style="{ color: record.score >= 60 ? '#52c41a' : '#ff4d4f' }">
                  {{ record.score }}
                </span>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import axios from 'axios';
import {
  UserOutlined,
  BookOutlined,
  FormOutlined,
  TrophyOutlined
} from '@ant-design/icons-vue';

const router = useRouter();
const stats = ref({
  userCount: 0,
  bankCount: 0,
  examCount: 0,
  avgScore: 0
});

const recentUsers = ref([]);
const recentExams = ref([]);

const userColumns = [
  {
    title: '头像',
    key: 'avatar',
    width: 50
  },
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username'
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
    width: 100
  }
];

const examColumns = [
  {
    title: '用户',
    dataIndex: ['examUser', 'username'],
    key: 'username'
  },
  {
    title: '题库',
    dataIndex: ['examBank', 'name'],
    key: 'bankName'
  },
  {
    title: '得分',
    dataIndex: 'score',
    key: 'score'
  },
  {
    title: '时间',
    dataIndex: 'create_time',
    key: 'create_time',
    customRender: ({ text }) => new Date(text).toLocaleString()
  }
];

const fetchDashboardData = async () => {
  try {
    const [statsRes, usersRes, examsRes] = await Promise.all([
      axios.get('/api/admin/stats'),
      axios.get('/api/admin/recent-users'),
      axios.get('/api/admin/recent-exams')
    ]);

    if (statsRes.data.success) {
      stats.value = statsRes.data.data;
    }

    if (usersRes.data.success) {
      recentUsers.value = usersRes.data.data;
    }

    if (examsRes.data.success) {
      recentExams.value = examsRes.data.data;
    }
  } catch (error) {
    message.error('获取数据失败');
  }
};

const viewUserDetail = (user) => {
  router.push(`/admin/users/${user.id}`);
};

onMounted(() => {
  fetchDashboardData();
});
</script>

<style scoped>
.admin-home {
  height: 100%;
  width: 100%;
  overflow-x: hidden;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #1f1f1f;
  text-align: center;
}

:deep(.ant-card) {
  height: 100%;
  border-radius: 8px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
}

:deep(.ant-card-head-title) {
  display: flex;
  align-items: center;
}

:deep(.anticon) {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style> 