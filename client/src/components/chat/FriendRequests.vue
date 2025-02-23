<template>
  <a-popover
    v-model:open="visible"
    trigger="click"
    placement="bottomRight"
    :overlay-style="{ width: '300px' }"
  >
    <template #content>
      <div class="friend-requests">
        <div class="requests-header">
          <span>好友请求</span>
          <a-badge :count="requests.length" />
        </div>
        <a-list
          :data-source="requests"
          :locale="{ emptyText: '暂无好友请求' }"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <div class="request-item">
                <div class="user-info">
                  <a-avatar :src="item.requestUser.avatar">
                    {{ item.requestUser.nickname?.substring(0, 1) || item.requestUser.username.substring(0, 1) }}
                  </a-avatar>
                  <div class="user-details">
                    <div class="user-name">{{ item.requestUser.nickname || item.requestUser.username }}</div>
                  </div>
                </div>
                <div class="request-actions">
                  <a-space>
                    <a-button type="primary" size="small" @click="handleAccept(item)">
                      接受
                    </a-button>
                    <a-button size="small" @click="handleReject(item)">
                      拒绝
                    </a-button>
                  </a-space>
                </div>
              </div>
            </a-list-item>
          </template>
        </a-list>
      </div>
    </template>
    <a-badge :count="requests.length">
      <a-button type="link">
        <template #icon>
          <span class="anticon">
            <svg viewBox="64 64 896 896" focusable="false" data-icon="user-add" width="1em" height="1em" fill="currentColor">
              <path d="M678.3 642.4c24.2-13 51.9-20.4 81.4-20.4h.1c3 0 4.4-3.6 2.2-5.6a371.67 371.67 0 00-103.7-65.8c-.4-.2-.8-.3-1.2-.5C719.2 505 759.6 431.7 759.6 349c0-137-110.8-248-247.5-248S264.7 212 264.7 349c0 82.7 40.4 156 102.6 201.1-.4.2-.8.3-1.2.5-44.7 18.9-84.8 46-119.3 80.6a373.42 373.42 0 00-80.4 119.5A373.6 373.6 0 00137 888.8a8 8 0 008 8.2h59.9c4.3 0 7.9-3.5 8-7.8 2-77.2 32.9-149.5 87.6-204.3C357 628.2 432.2 597 512.2 597c56.7 0 111.1 15.7 158 45.1a8.1 8.1 0 008.1.3zM512.2 521c-45.8 0-88.9-17.9-121.4-50.4A171.2 171.2 0 01340.5 349c0-45.9 17.9-89.1 50.3-121.6S466.3 177 512.2 177s88.9 17.9 121.4 50.4A171.2 171.2 0 01683.9 349c0 45.9-17.9 89.1-50.3 121.6C601.1 503.1 558 521 512.2 521zM880 759h-84v-84c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v84h-84c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h84v84c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-84h84c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8z"></path>
            </svg>
          </span>
        </template>
        好友请求
      </a-button>
    </a-badge>
  </a-popover>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import axios from 'axios';
import { wsClient } from '../../utils/websocket';
import { useRouter } from 'vue-router';

const router = useRouter();
const visible = ref(false);
const requests = ref([]);

// 获取好友请求列表
const fetchRequests = async () => {
  try {
    const response = await axios.get('/api/friends/requests');
    if (response.data.success) {
      requests.value = response.data.data;
    }
  } catch (error) {
    console.error('获取好友请求列表失败:', error);
  }
};

// 接受好友请求
const handleAccept = async (request) => {
  try {
    const response = await axios.put(`/api/friends/request/${request.id}`, {
      status: 'accepted'
    });

    if (response.data.success) {
      message.success('已接受好友请求');
      requests.value = requests.value.filter(r => r.id !== request.id);
      if (requests.value.length === 0) {
        visible.value = false;
      }
      
      // 刷新好友列表
      router.go(0);
    }
  } catch (error) {
    message.error('处理好友请求失败');
  }
};

// 拒绝好友请求
const handleReject = async (request) => {
  try {
    const response = await axios.put(`/api/friends/request/${request.id}`, {
      status: 'rejected'
    });

    if (response.data.success) {
      message.success('已拒绝好友请求');
      requests.value = requests.value.filter(r => r.id !== request.id);
      if (requests.value.length === 0) {
        visible.value = false;
      }
    }
  } catch (error) {
    message.error('处理好友请求失败');
  }
};

// 监听新的好友请求
wsClient.onMessage('new_friend_request', (data) => {
  console.log('收到新的好友请求:', data);
  fetchRequests();
  message.info(`收到来自 ${data.fromUser.nickname || data.fromUser.username} 的好友请求`);
});

// 监听好友关系更新
wsClient.onMessage('friendship_update', (data) => {
  console.log('好友关系更新:', data);
  if (data.action === 'accepted') {
    message.success('对方已接受您的好友请求');
    // 刷新好友列表
    router.go(0);
  }
});

onMounted(() => {
  fetchRequests();
});
</script>

<style scoped>
.friend-requests {
  max-height: 400px;
  overflow-y: auto;
}

.requests-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  margin-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.request-item {
  width: 100%;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.user-details {
  margin-left: 12px;
}

.user-name {
  font-weight: 500;
}

.request-actions {
  display: flex;
  justify-content: flex-end;
}

:deep(.ant-list-empty-text) {
  padding: 16px;
  text-align: center;
  color: #999;
}

:deep(.ant-badge-count) {
  background: #ff4d4f;
}

:deep(.ant-popover-inner-content) {
  padding: 16px;
}
</style> 