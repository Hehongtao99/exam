<template>
  <div class="friend-list">
    <!-- 搜索框 -->
    <div class="search-box">
      <a-input-search
        v-model:value="searchText"
        placeholder="搜索好友"
        style="width: 100%"
        @search="handleSearch"
      >
        <template #prefix>
          <span class="anticon">
            <svg viewBox="64 64 896 896" focusable="false" data-icon="search" width="1em" height="1em" fill="currentColor">
              <path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"></path>
            </svg>
          </span>
        </template>
      </a-input-search>
    </div>

    <!-- 好友列表 -->
    <div class="friend-list-content">
      <a-list>
        <a-list-item 
          v-for="friend in filteredFriends" 
          :key="friend.id"
          class="friend-item"
          :class="{ 'friend-item-selected': selectedFriend?.id === friend.id }"
          @click="handleSelect(friend)"
        >
          <div class="friend-info">
            <div class="avatar-container">
              <a-badge :dot="friend.hasUnread">
                <a-avatar :src="friend.avatar" :size="40">
                  {{ friend.nickname?.substring(0, 1) || friend.username.substring(0, 1) }}
                </a-avatar>
              </a-badge>
              <span class="online-status" :class="{ 'is-online': friend.online }"></span>
            </div>
            <div class="friend-details">
              <div class="friend-name">
                {{ friend.nickname || friend.username }}
              </div>
              <div class="friend-signature" v-if="friend.signature">
                {{ friend.signature }}
              </div>
            </div>
          </div>
          <div class="friend-actions">
            <a-dropdown 
              placement="bottomRight" 
              :trigger="['click']" 
              @click.stop
            >
              <a-button type="text" class="action-button">
                <template #icon>
                  <span class="anticon">
                    <svg viewBox="64 64 896 896" focusable="false" data-icon="more" width="1em" height="1em" fill="currentColor">
                      <path d="M456 231a56 56 0 10112 0 56 56 0 10-112 0zm0 280a56 56 0 10112 0 56 56 0 10-112 0zm0 280a56 56 0 10112 0 56 56 0 10-112 0z"></path>
                    </svg>
                  </span>
                </template>
              </a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click.stop="showEditRemark(friend)">
                    <template #icon>
                      <span class="anticon">
                        <svg viewBox="64 64 896 896" focusable="false" data-icon="edit" width="1em" height="1em" fill="currentColor">
                          <path d="M880 836H144c-17.7 0-32 14.3-32 32v36c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-36c0-17.7-14.3-32-32-32zm-622.3-84c2 0 4-.2 6-.5L431.9 722c2-.4 3.9-1.3 5.3-2.8l423.9-423.9a9.96 9.96 0 000-14.1L694.9 114.9c-1.9-1.9-4.4-2.9-7.1-2.9s-5.2 1-7.1 2.9L256.8 538.8c-1.5 1.5-2.4 3.3-2.8 5.3l-29.5 168.2a33.5 33.5 0 009.4 29.8c6.6 6.4 14.9 9.9 23.8 9.9zm67.4-174.4L687.8 215l73.3 73.3-362.7 362.6-88.9 15.7 15.6-89z"></path>
                        </svg>
                      </span>
                    </template>
                    修改备注
                  </a-menu-item>
                  <a-menu-item danger @click.stop="showDeleteConfirm(friend)">
                    <template #icon>
                      <span class="anticon">
                        <svg viewBox="64 64 896 896" focusable="false" data-icon="delete" width="1em" height="1em" fill="currentColor">
                          <path d="M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z"></path>
                        </svg>
                      </span>
                    </template>
                    删除好友
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </a-list-item>
      </a-list>
    </div>

    <!-- 修改备注对话框 -->
    <a-modal
      v-model:open="remarkModalVisible"
      title="修改好友备注"
      @ok="handleEditRemark"
      :confirm-loading="remarkLoading"
    >
      <a-input v-model:value="remarkForm.nickname" placeholder="请输入备注名" />
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { message, Modal } from 'ant-design-vue';
import axios from 'axios';
import { wsClient } from '../../utils/websocket';

const emit = defineEmits(['select']);
const friends = ref([]);
const remarkModalVisible = ref(false);
const remarkLoading = ref(false);
const remarkForm = ref({
  friendId: null,
  nickname: ''
});

const searchText = ref('');
const selectedFriend = ref(null);

// 获取好友列表
const fetchFriends = async () => {
  try {
    const [friendsResponse, unreadResponse] = await Promise.all([
      axios.get('/api/friends/list'),
      axios.get('/api/messages/unread')
    ]);

    if (friendsResponse.data.success) {
      const unreadCounts = unreadResponse.data.success ? unreadResponse.data.data : [];
      const unreadMap = new Map(unreadCounts.map(item => [item.fromUserId, item.count]));

      friends.value = friendsResponse.data.data.map(friend => ({
        ...friend,
        online: wsClient.isUserOnline(friend.id),
        hasUnread: unreadMap.get(friend.id) > 0
      }));
    }
  } catch (error) {
    message.error('获取好友列表失败');
  }
};

// 更新好友在线状态
const updateFriendStatus = (userId, status) => {
  const friend = friends.value.find(f => f.id === parseInt(userId));
  if (friend) {
    friend.online = status === 'online';
  }
};

// 更新未读消息状态
const updateUnreadStatus = (fromUserId, hasUnread) => {
  const friend = friends.value.find(f => f.id === parseInt(fromUserId));
  if (friend) {
    friend.hasUnread = hasUnread;
  }
};

// 处理在线状态列表
const handleOnlineStatusList = (data) => {
  Object.entries(data.statuses).forEach(([userId, status]) => {
    updateFriendStatus(userId, status);
  });
};

// 选择好友
const handleSelect = (friend) => {
  selectedFriend.value = friend;
  friend.hasUnread = false;
  emit('select', friend);
};

// 设置WebSocket监听器
const setupWebSocketListeners = () => {
  // 监听单个好友状态更新
  wsClient.onMessage('status', (data) => {
    updateFriendStatus(data.userId, data.status);
  });

  // 监听在线状态列表更新
  wsClient.onMessage('online_status_list', (data) => {
    handleOnlineStatusList(data);
  });

  // 监听好友关系更新
  wsClient.onMessage('friendship_update', (data) => {
    if (data.action === 'accepted') {
      fetchFriends();
    } else if (data.action === 'deleted') {
      // 从好友列表中移除该好友
      friends.value = friends.value.filter(f => f.id !== data.friendId);
      message.info('您已被对方删除好友');
    }
  });

  // 监听新消息
  ['text', 'image', 'file'].forEach(type => {
    wsClient.onMessage(type, (data) => {
      updateUnreadStatus(data.fromUserId, true);
    });
  });
};

// 显示修改备注对话框
const showEditRemark = (friend) => {
  remarkForm.value = {
    friendId: friend.id,
    nickname: friend.nickname || ''
  };
  remarkModalVisible.value = true;
};

// 处理修改备注
const handleEditRemark = async () => {
  if (!remarkForm.value.friendId) return;
  
  remarkLoading.value = true;
  try {
    const response = await axios.put(
      `/api/friends/nickname/${remarkForm.value.friendId}`,
      { nickname: remarkForm.value.nickname }
    );
    
    if (response.data.success) {
      message.success('备注修改成功');
      remarkModalVisible.value = false;
      // 更新本地好友列表
      const friend = friends.value.find(f => f.id === remarkForm.value.friendId);
      if (friend) {
        friend.nickname = remarkForm.value.nickname;
      }
    }
  } catch (error) {
    message.error('修改备注失败');
  } finally {
    remarkLoading.value = false;
  }
};

// 显示删除确认对话框
const showDeleteConfirm = (friend) => {
  Modal.confirm({
    title: '删除好友',
    content: `确定要删除好友"${friend.nickname || friend.username}"吗？`,
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        const response = await axios.delete(`/api/friends/${friend.id}`);
        if (response.data.success) {
          message.success('好友删除成功');
          // 从列表中移除该好友
          friends.value = friends.value.filter(f => f.id !== friend.id);
        }
      } catch (error) {
        message.error('删除好友失败');
      }
    }
  });
};

// 根据搜索文本过滤好友列表
const filteredFriends = computed(() => {
  if (!searchText.value) return friends.value;
  const searchLower = searchText.value.toLowerCase();
  return friends.value.filter(friend => 
    (friend.nickname || friend.username).toLowerCase().includes(searchLower)
  );
});

// 处理搜索
const handleSearch = (value) => {
  searchText.value = value;
};

onMounted(() => {
  fetchFriends();
  setupWebSocketListeners();
});

onBeforeUnmount(() => {
  // 清理WebSocket监听器
  wsClient.onMessage('status', null);
  wsClient.onMessage('online_status_list', null);
  wsClient.onMessage('friendship_update', null);
  ['text', 'image', 'file'].forEach(type => {
    wsClient.onMessage(type, null);
  });
});
</script>

<style scoped>
.friend-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-right: 1px solid #f0f0f0;
}

.search-box {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.friend-list-content {
  flex: 1;
  overflow-y: auto;
}

.friend-item {
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0f0f0;
}

.friend-item:hover {
  background-color: rgba(24, 144, 255, 0.1);
}

.friend-item-selected {
  background-color: rgba(24, 144, 255, 0.15);
}

.friend-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

.avatar-container {
  position: relative;
  width: 40px;
  height: 40px;
}

.online-status {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #bfbfbf;
  border: 2px solid #fff;
}

.online-status.is-online {
  background-color: #52c41a;
}

.friend-details {
  flex: 1;
  min-width: 0;
}

.friend-name {
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.friend-signature {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.friend-actions {
  display: flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.friend-item:hover .friend-actions {
  opacity: 1;
}

.action-button {
  color: #999;
  padding: 4px;
}

.action-button:hover {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.1);
}

:deep(.ant-list-item) {
  padding: 0;
}

:deep(.ant-avatar) {
  background: #1890ff;
}

:deep(.ant-dropdown-menu-item) {
  min-width: 120px;
  padding: 8px 12px;
}

:deep(.ant-dropdown-menu-item .anticon) {
  margin-right: 8px;
}

:deep(.ant-badge-dot) {
  box-shadow: none;
  width: 8px;
  height: 8px;
}

:deep(.ant-input-search .ant-input-prefix) {
  color: #bfbfbf;
}
</style> 