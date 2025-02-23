<template>
  <a-modal
    :open="modelValue"
    title="添加好友"
    @ok="handleSearch"
    @cancel="handleCancel"
    @update:open="$emit('update:modelValue', $event)"
  >
    <a-input-search
      v-model:value="searchText"
      placeholder="请输入用户名搜索"
      enter-button
      @search="handleSearch"
    />

    <div class="search-results" v-if="searchResults.length > 0">
      <a-list>
        <a-list-item v-for="user in searchResults" :key="user.id">
          <div class="user-info">
            <a-avatar :src="user.avatar">
              {{ user.nickname?.substring(0, 1) || user.username.substring(0, 1) }}
            </a-avatar>
            <div class="user-details">
              <div class="user-name">{{ user.nickname || user.username }}</div>
              <div class="user-signature" v-if="user.signature">{{ user.signature }}</div>
            </div>
          </div>
          <template #extra>
            <a-button 
              type="primary"
              size="small"
              :disabled="user.isFriend || user.hasSentRequest"
              @click="handleAddFriend(user)"
            >
              {{ 
                user.isFriend ? '已是好友' :
                user.hasSentRequest ? '已发送请求' :
                '添加好友'
              }}
            </a-button>
          </template>
        </a-list-item>
      </a-list>
    </div>

    <div class="empty-result" v-else-if="hasSearched">
      <a-empty description="未找到相关用户" />
    </div>
  </a-modal>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue';
import { message } from 'ant-design-vue';
import axios from 'axios';
import { useUserStore } from '../../store/user';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);
const userStore = useUserStore();

const searchText = ref('');
const searchResults = ref([]);
const hasSearched = ref(false);

// 搜索用户
const handleSearch = async () => {
  if (!searchText.value) {
    message.warning('请输入搜索内容');
    return;
  }

  try {
    const response = await axios.get(`/api/friends/search?username=${searchText.value}`);
    if (response.data.success) {
      // 检查是否已经是好友
      const friendsResponse = await axios.get('/api/friends/list');
      const friendIds = friendsResponse.data.success ? 
        friendsResponse.data.data.map(friend => friend.id) : [];

      // 检查是否有待处理的好友请求
      const requestsResponse = await axios.get('/api/friends/requests');
      const pendingRequestIds = requestsResponse.data.success ?
        requestsResponse.data.data.map(request => request.userId) : [];

      searchResults.value = response.data.data.map(user => ({
        ...user,
        isFriend: friendIds.includes(user.id),
        hasSentRequest: pendingRequestIds.includes(user.id)
      }));
      hasSearched.value = true;
    }
  } catch (error) {
    console.error('搜索失败:', error);
    message.error('搜索失败');
  }
};

// 添加好友
const handleAddFriend = async (user) => {
  if (!user.id) {
    message.error('用户ID无效');
    return;
  }

  try {
    console.log('发送好友请求:', {
      userId: userStore.id,
      friendId: user.id
    });

    const response = await axios.post('/api/friends/request', {
      friendId: user.id
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userStore.id
      }
    });

    if (response.data.success) {
      message.success('好友请求已发送');
      user.hasSentRequest = true;
    }
  } catch (error) {
    console.error('添加好友失败:', error.response || error);
    const errorMsg = error.response?.data?.message || '发送好友请求失败';
    message.error(errorMsg);
  }
};

// 取消
const handleCancel = () => {
  searchText.value = '';
  searchResults.value = [];
  hasSearched.value = false;
  emit('update:modelValue', false);
};

// 监听modelValue变化
watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    handleCancel();
  }
});
</script>

<style scoped>
.search-results {
  margin-top: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-details {
  margin-left: 12px;
}

.user-name {
  font-weight: 500;
}

.user-signature {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.empty-result {
  margin-top: 32px;
  text-align: center;
}
</style> 