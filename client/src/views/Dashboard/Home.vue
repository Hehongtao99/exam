<template>
  <div class="dashboard-home">
    <a-row :gutter="[16, 16]">
      <!-- 统计卡片 -->
      <a-col :span="6">
        <a-card>
          <template #title>
            <span>
              <span class="anticon" style="margin-right: 8px;">
                <svg viewBox="64 64 896 896" focusable="false" data-icon="book" width="1em" height="1em" fill="currentColor"><path d="M832 64H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-260 72h96v209.9L621.5 312 572 347.4V136zm220 752H232V136h280v296.9c0 3.3 1 6.6 3 9.3a15.9 15.9 0 0022.3 3.7l83.8-59.9 81.4 59.4c2.7 2 6 3.1 9.4 3.1 8.8 0 16-7.2 16-16V136h64v752z"></path></svg>
              </span>
              题库数量
            </span>
          </template>
          <div class="stat-number">{{ stats.bankCount }}</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <template #title>
            <span>
              <span class="anticon" style="margin-right: 8px;">
                <svg viewBox="64 64 896 896" focusable="false" data-icon="form" width="1em" height="1em" fill="currentColor"><path d="M904 512h-56c-4.4 0-8 3.6-8 8v320H184V184h320c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V520c0-4.4-3.6-8-8-8z"></path><path d="M355.9 534.9L354 653.8c-.1 8.9 7.1 16.2 16 16.2h.4l118-2.9c2-.1 4-.9 5.4-2.3l415.9-415c3.1-3.1 3.1-8.2 0-11.3L785.4 114.3c-1.6-1.6-3.6-2.3-5.7-2.3s-4.1.8-5.7 2.3l-415.8 415a8.3 8.3 0 00-2.3 5.6zm63.5 23.6L779.7 199l45.2 45.1-360.5 359.7-45.7 1.1.7-46.4z"></path></svg>
              </span>
              考试次数
            </span>
          </template>
          <div class="stat-number">{{ stats.examCount }}</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <template #title>
            <span>
              <span class="anticon" style="margin-right: 8px;">
                <svg viewBox="64 64 896 896" focusable="false" data-icon="trophy" width="1em" height="1em" fill="currentColor"><path d="M868 160h-92v-40c0-4.4-3.6-8-8-8H256c-4.4 0-8 3.6-8 8v40h-92a44 44 0 00-44 44v148c0 81.7 60 149.6 138.2 162C265.7 630.2 359 721.7 476 734.5v105.2H280c-17.7 0-32 14.3-32 32V904c0 4.4 3.6 8 8 8h512c4.4 0 8-3.6 8-8v-32.3c0-17.7-14.3-32-32-32H548V734.5C665 721.7 758.3 630.2 773.8 514 852 501.6 912 433.7 912 352V204a44 44 0 00-44-44zM184 352V204h92v207.6a91.99 91.99 0 01-92-59.6zm656 0a91.99 91.99 0 01-92 59.6V204h92v148z"></path></svg>
              </span>
              平均分数
            </span>
          </template>
          <div class="stat-number">{{ stats.avgScore }}</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card>
          <template #title>
            <span>
              <span class="anticon" style="margin-right: 8px;">
                <svg viewBox="64 64 896 896" focusable="false" data-icon="exception" width="1em" height="1em" fill="currentColor"><path d="M688 312v-48c0-4.4-3.6-8-8-8H296c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h384c4.4 0 8-3.6 8-8zm-392 88c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h184c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H296zm376 116c-119.3 0-216 96.7-216 216s96.7 216 216 216 216-96.7 216-216-96.7-216-216-216zm107.5 323.5C750.8 868.2 712.6 884 672 884s-78.8-15.8-107.5-44.5C535.8 810.8 520 772.6 520 732s15.8-78.8 44.5-107.5C593.2 595.8 631.4 580 672 580s78.8 15.8 107.5 44.5C808.2 653.2 824 691.4 824 732s-15.8 78.8-44.5 107.5zM640 812a32 32 0 1064 0 32 32 0 10-64 0zm12-64h40c4.4 0 8-3.6 8-8V628c0-4.4-3.6-8-8-8h-40c-4.4 0-8 3.6-8 8v112c0 4.4 3.6 8 8 8zM440 852H208V148h560v344c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V108c0-17.7-14.3-32-32-32H168c-17.7 0-32 14.3-32 32v784c0 17.7 14.3 32 32 32h272c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8z"></path></svg>
              </span>
              错题数量
            </span>
          </template>
          <div class="stat-number">{{ stats.mistakeCount }}</div>
        </a-card>
      </a-col>

      <!-- 最近考试记录 -->
      <a-col :span="16">
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
              <template v-if="column.key === 'action'">
                <a-button type="link" @click="viewExamResult(record)">
                  查看详情
                </a-button>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>

      <!-- 错题分布 -->
      <a-col :span="8">
        <a-card title="错题分布">
          <div ref="chartRef" style="height: 300px"></div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import axios from 'axios';
import * as echarts from 'echarts';

const router = useRouter();
const chartRef = ref(null);
let chart = null;

const handleResize = () => {
  chart?.resize();
};

const stats = ref({
  bankCount: 0,
  examCount: 0,
  avgScore: 0,
  mistakeCount: 0
});

const recentExams = ref([]);

const examColumns = [
  {
    title: '考试时间',
    dataIndex: 'create_time',
    key: 'create_time',
    width: 180,
    customRender: ({ text }) => new Date(text).toLocaleString()
  },
  {
    title: '题库',
    dataIndex: ['questionBank', 'name'],
    key: 'bankName'
  },
  {
    title: '得分',
    dataIndex: 'score',
    key: 'score',
    width: 100
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
    align: 'center'
  }
];

const viewExamResult = (record) => {
  router.push(`/dashboard/exam-result/${record.id}`);
};

const fetchDashboardData = async () => {
  try {
    const [statsRes, examsRes, mistakesRes] = await Promise.all([
      axios.get('/api/dashboard/stats'),
      axios.get('/api/dashboard/recent-exams'),
      axios.get('/api/dashboard/mistake-stats')
    ]);

    if (statsRes.data.success) {
      stats.value = statsRes.data.data;
    }

    if (examsRes.data.success) {
      recentExams.value = examsRes.data.data;
    }

    if (mistakesRes.data.success && chartRef.value) {
      const mistakeData = mistakesRes.data.data;
      initChart(mistakeData);
    }
  } catch (error) {
    message.error('获取数据失败');
  }
};

const initChart = (data) => {
  if (!chartRef.value) return;

  if (!chart) {
    chart = echarts.init(chartRef.value);
  }

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        name: '错题分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '14',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: data.single || 0, name: '单选题' },
          { value: data.multiple || 0, name: '多选题' },
          { value: data.judge || 0, name: '判断题' },
          { value: data.essay || 0, name: '问答题' }
        ]
      }
    ]
  };

  chart.setOption(option);
};

onMounted(() => {
  fetchDashboardData();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  chart?.dispose();
});
</script>

<style scoped>
.dashboard-home {
  padding: 24px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #1f1f1f;
  text-align: center;
}

:deep(.ant-card) {
  height: 100%;
}

:deep(.ant-card-head-title) {
  display: flex;
  align-items: center;
}
</style> 