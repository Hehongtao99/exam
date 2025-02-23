<template>
  <div class="user-detail">
    <a-card :bordered="false">
      <template #title>
        <div class="page-header">
          <a-space>
            <a-button @click="router.back()">
              <template #icon><arrow-left-outlined /></template>
              返回
            </a-button>
            <span class="page-title">用户详情</span>
          </a-space>
        </div>
      </template>

      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="用户名">
          {{ userInfo.username }}
        </a-descriptions-item>
        <a-descriptions-item label="昵称">
          {{ userInfo.nickname || '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="头像">
          <a-avatar :src="userInfo.avatar">
            {{ userInfo.nickname?.substring(0, 1) || userInfo.username?.substring(0, 1) }}
          </a-avatar>
        </a-descriptions-item>
        <a-descriptions-item label="角色">
          {{ userInfo.role === 'admin' ? '管理员' : '普通用户' }}
        </a-descriptions-item>
        <a-descriptions-item label="注册时间">
          {{ userInfo.create_time ? new Date(userInfo.create_time).toLocaleString() : '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="最后更新">
          {{ userInfo.update_time ? new Date(userInfo.update_time).toLocaleString() : '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="个性签名" :span="2">
          {{ userInfo.signature || '-' }}
        </a-descriptions-item>
      </a-descriptions>

      <!-- 用户统计信息 -->
      <div class="statistics-section">
        <h3>用户统计</h3>
        <a-row :gutter="16" class="mt-4">
          <a-col :span="8">
            <a-statistic title="题库数量" :value="statistics.bankCount" />
          </a-col>
          <a-col :span="8">
            <a-statistic title="考试次数" :value="statistics.examCount" />
          </a-col>
          <a-col :span="8">
            <a-statistic title="平均分数" :value="statistics.avgScore" :precision="1" suffix="分" />
          </a-col>
        </a-row>
      </div>

      <!-- 最近考试记录 -->
      <div class="exam-history-section">
        <h3>最近考试记录</h3>
        <a-table
          :columns="examColumns"
          :data-source="examHistory"
          :pagination="false"
          class="mt-4"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'score'">
              <span :style="{ color: record.score >= 60 ? '#52c41a' : '#f5222d' }">
                {{ record.score }}
              </span>
            </template>
          </template>
        </a-table>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import axios from 'axios';
import { ArrowLeftOutlined } from '@ant-design/icons-vue';

const router = useRouter();
const route = useRoute();
const userInfo = ref({});
const statistics = ref({
  bankCount: 0,
  examCount: 0,
  avgScore: 0
});
const examHistory = ref([]);

const examColumns = [
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
    title: '时间',
    dataIndex: 'create_time',
    key: 'create_time',
    customRender: ({ text }) => new Date(text).toLocaleString()
  }
];

const fetchUserData = async () => {
  try {
    const userId = route.params.id;
    const [userRes, statsRes, examRes] = await Promise.all([
      axios.get(`/api/admin/users/${userId}`),
      axios.get(`/api/admin/users/${userId}/stats`),
      axios.get(`/api/admin/users/${userId}/exams`)
    ]);

    if (userRes.data.success) {
      userInfo.value = userRes.data.data;
    }

    if (statsRes.data.success) {
      statistics.value = statsRes.data.data;
    }

    if (examRes.data.success) {
      examHistory.value = examRes.data.data;
    }
  } catch (error) {
    message.error('获取用户信息失败');
  }
};

onMounted(() => {
  fetchUserData();
});
</script>

<style scoped>
.user-detail {
  min-height: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  font-size: 16px;
  font-weight: 500;
}

.statistics-section,
.exam-history-section {
  margin-top: 24px;
}

h3 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  color: #1f1f1f;
}

.mt-4 {
  margin-top: 16px;
}
</style> 