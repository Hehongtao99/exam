<template>
  <div class="chat-container">
    <a-row class="chat-layout">
      <!-- 左侧好友列表 -->
      <a-col :span="6" class="friend-list">
        <a-tabs default-active-key="1" class="chat-tabs">
          <a-tab-pane key="1" tab="好友">
        <div class="friend-header">
          <a-input-search
            v-model:value="searchText"
            placeholder="搜索用户"
            @search="handleSearch"
          />
        </div>
        
        <!-- 好友请求提醒 -->
        <div v-if="friendRequests.length > 0" class="friend-requests" @click="showRequestsModal">
          <a-alert
            type="info"
            :message="`您有 ${friendRequests.length} 个新的好友请求`"
            banner
          />
        </div>

        <!-- 好友列表 -->
          <div class="friend-scroll">
          <div
            v-for="friend in friends"
            :key="friend.id"
            class="friend-item"
            :class="{ active: currentFriend?.id === friend.id, deleted: friend.isDeleted }"
            @click="selectFriend(friend)"
          >
            <a-badge :count="friend.unreadCount || 0">
              <a-avatar
                :size="40"
                :src="friend.avatar"
              >
                {{ friend.nickname?.[0] || friend.username?.[0] }}
              </a-avatar>
            </a-badge>
            <div class="friend-info">
              <div class="friend-name">
                {{ friend.nickname || friend.username }}
                <span v-if="friend.unreadCount" class="unread-count">
                  {{ friend.unreadCount }}
                </span>
              </div>
              <div class="friend-status" :class="{ online: friend.online }">
                {{ friend.online ? '在线' : '离线' }}
              </div>
            </div>
          </div>
        </div>
          </a-tab-pane>
          <a-tab-pane key="2" tab="群组">
            <div class="group-scroll">
              <div class="group-create">
                <a-button type="primary" block @click="showCreateGroupModal">
                  创建群组
                </a-button>
              </div>
              <div 
                v-for="group in groups" 
                :key="group.id"
                class="group-item"
                :class="{ active: currentGroup?.id === group.id }"
                @click="selectGroup(group)"
              >
                <a-avatar :size="40" :src="group.avatar">
                  {{ group.name[0] }}
                </a-avatar>
                <div class="group-info">
                  <div class="group-name">
                    {{ group.name }}
                    <span v-if="group.unreadCount" class="unread-count">
                      {{ group.unreadCount }}
                    </span>
                  </div>
                  <div class="group-members">
                    成员: {{ group.memberCount }}
                  </div>
                </div>
              </div>
            </div>
          </a-tab-pane>
        </a-tabs>
      </a-col>

      <!-- 右侧聊天区域 -->
      <a-col :span="18" class="chat-main">
        <template v-if="currentFriend || currentGroup">
          <div class="chat-header">
            <span v-if="currentFriend">
              {{ currentFriend.nickname || currentFriend.username }}
            </span>
            <span v-if="currentGroup">
              {{ currentGroup.name }} ({{ currentGroup.memberCount }}人)
            </span>
          </div>
          
          <div class="chat-messages" ref="messageContainer">
            <div v-for="msg in messages" :key="msg.id" class="message-item">
              <div v-if="msg.groupId" class="message-sender">
                {{ msg.fromUser.nickname || msg.fromUser.username }}
              </div>
              <div class="message-content" :class="{ 
                'message-self': msg.fromUserId === userStore.id,
                'group-message': msg.groupId
              }">
                <a-avatar
                  :size="36"
                  :src="msg.fromUserId === userStore.id ? userStore.avatar : currentFriend.avatar"
                >
                  <span v-if="!msg.groupId">
                    {{ msg.fromUserId === userStore.id ? userStore.username[0] : currentFriend?.username[0] }}
                  </span>
                  <span v-else>
                    {{ msg.fromUser.nickname?.[0] || msg.fromUser.username[0] }}
                  </span>
                </a-avatar>
                <div class="message-bubble" :class="{ 'image-message': msg.type === 'image' }">
                  <template v-if="msg.type === 'text'">
                    {{ msg.content }}
                  </template>
                  <template v-else-if="msg.type === 'image'">
                    <img 
                      :src="msg.content" 
                      class="message-image" 
                      @click="showPreviewImage(msg.content)"
                    />
                  </template>
                  <template v-else-if="msg.type === 'file'">
                    <div class="file-message" @click="downloadFile(msg)">
                      <file-outlined />
                      <div class="file-info">
                        <div class="file-name">{{ msg.metadata?.name || '未知文件' }}</div>
                        <div class="file-size">{{ formatFileSize(msg.metadata?.size) }}</div>
                      </div>
                    </div>
                  </template>
                  <template v-else-if="msg.type === 'question_bank'">
                    <div class="question-bank-message">
                      <div class="bank-list">
                        <div v-for="bank in parseQuestionBanks(msg.content)" :key="bank.id" class="bank-item">
                          <div class="bank-header">
                            <span class="bank-icon">
                              <book-outlined />
                            </span>
                            <span class="bank-name">{{ bank.name }}</span>
                          </div>
                          <div class="bank-desc">{{ bank.description || '暂无描述' }}</div>
                          <div class="bank-footer">
                            <span class="bank-count">题目数量: {{ bank.questionCount }}</span>
                            <a-button 
                              type="link" 
                              size="small"
                              @click="handleAcceptBank(bank, msg.fromUserId)"
                              :disabled="bank.accepted"
                            >
                              {{ bank.accepted ? '已添加' : '添加到我的题库' }}
                            </a-button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                  <div class="message-time">
                    {{ formatTime(msg.create_time) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="chat-input">
          <MessageInput 
            @send="handleSend" 
            :disabled="(!currentFriend && !currentGroup) || (currentFriend?.isDeleted)"
            :is-group="!!currentGroup"
          />
          </div>
        </template>
        
        <div v-else class="chat-placeholder">
          <a-empty description="选择一个好友开始聊天" />
        </div>
      </a-col>
    </a-row>

    <!-- 好友请求弹窗 -->
    <a-modal
      v-model:open="requestsModalVisible"
      title="好友请求"
      @cancel="requestsModalVisible = false"
    >
      <div class="request-list">
        <div v-for="request in friendRequests" :key="request.id" class="request-item">
          <a-avatar :size="40" :src="request.requestUser?.avatar">
            {{ request.requestUser?.nickname?.[0]?.toUpperCase() || request.requestUser?.username?.[0]?.toUpperCase() }}
          </a-avatar>
          <div class="request-info">
            <div class="request-name">
              {{ request.requestUser?.nickname || request.requestUser?.username }}
            </div>
            <div class="request-time">
              {{ formatTime(request.create_time) }}
            </div>
          </div>
          <div class="request-actions">
            <a-button type="primary" size="small" @click="handleRequest(request.id, 'accepted')">
              接受
            </a-button>
            <a-button size="small" @click="handleRequest(request.id, 'rejected')" style="margin-left: 8px;">
              拒绝
            </a-button>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 搜索用户弹窗 -->
    <a-modal
      v-model:open="searchModalVisible"
      title="搜索用户"
      @cancel="searchModalVisible = false"
    >
      <div class="search-list">
        <div v-for="user in searchResults" :key="user.id" class="search-item">
          <a-avatar :size="40" :src="user.avatar">
            {{ user.nickname?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() }}
          </a-avatar>
          <div class="search-info">
            <div class="search-name">
              {{ user.nickname || user.username }}
            </div>
          </div>
          <a-button
            type="primary"
            size="small"
            :disabled="user.id === userId || user.isFriend || user.hasSentRequest"
            @click="sendFriendRequest(user.id)"
          >
            {{ 
              user.id === userId ? '不能添加自己' :
              user.isFriend ? '已是好友' :
              user.hasSentRequest ? '已发送请求' :
              '添加好友'
            }}
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- 修改备注弹窗 -->
    <a-modal
      v-model:open="nicknameModalVisible"
      title="修改备注"
      @ok="handleUpdateNickname"
      @cancel="nicknameModalVisible = false"
    >
      <a-input v-model:value="newNickname" placeholder="请输入新的备注名" />
    </a-modal>

    <!-- 图片预览弹窗 -->
    <a-modal
      v-model:open="previewVisible"
      title="图片预览"
      width="80%"
      :footer="null"
    >
      <img :src="previewImage" class="preview-image" />
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { message } from 'ant-design-vue'
import { useUserStore } from '../store/user'
import MessageInput from '../components/chat/MessageInput.vue'
import { 
  EllipsisOutlined, 
  ExclamationCircleOutlined, 
  PictureOutlined,
  AudioOutlined,
  FileOutlined,
  SoundOutlined,
  BookOutlined
} from '@ant-design/icons-vue'
import axios from 'axios'
import { wsClient } from '../utils/websocket'

const userStore = useUserStore()
const userId = computed(() => userStore.id)
const userAvatar = computed(() => userStore.avatar)

const ws = ref(null)
const friends = ref([])
const groups = ref([])
const currentFriend = ref(null)
const currentGroup = ref(null)
const messages = ref([])
const createGroupModalVisible = ref(false)
const newGroupName = ref('')
const inputMessage = ref('')
const friendRequests = ref([])
const searchText = ref('')
const searchResults = ref([])
const messageContainer = ref(null)

const requestsModalVisible = ref(false)
const searchModalVisible = ref(false)
const nicknameModalVisible = ref(false)
const newNickname = ref('')
const selectedFriend = ref(null)

// 图片预览
const previewVisible = ref(false);
const previewImage = ref('');

// 群组相关方法
const fetchGroups = async () => {
  try {
    const response = await axios.get('/api/group/list')
    if (response.data.success) {
      groups.value = response.data.data.map(group => ({
        ...group,
        unreadCount: 0
      }))
    }
  } catch (error) {
    message.error('获取群组列表失败')
  }
}

const selectGroup = async (group) => {
  currentGroup.value = group
  currentFriend.value = null
  messages.value = []
  
  try {
    const response = await axios.get(`/api/group_messages/history/${group.id}`)
    if (response.data.success) {
      messages.value = response.data.data
    }
    
    if (group.unreadCount > 0) {
      await axios.put(`/api/group_messages/read/${group.id}`)
      group.unreadCount = 0
    }
    
    scrollToBottom()
  } catch (error) {
    message.error('获取群聊记录失败')
  }
}

const showCreateGroupModal = () => {
  createGroupModalVisible.value = true
}

const handleCreateGroup = async () => {
  if (!newGroupName.value.trim()) {
    message.error('请输入群组名称')
    return
  }
  
  try {
    const response = await axios.post('/api/group/create', {
      name: newGroupName.value
    })
    if (response.data.success) {
      groups.value.push(response.data.data)
      createGroupModalVisible.value = false
      newGroupName.value = ''
      message.success('群组创建成功')
    }
  } catch (error) {
    message.error('创建群组失败')
  }
}

// WebSocket连接
const connectWebSocket = () => {
  const wsUrl = `ws://localhost:3000?userId=${userStore.id}`;
  ws.value = new WebSocket(wsUrl);
  
  ws.value.onopen = () => {
    console.log('WebSocket连接已建立');
  };
  
  ws.value.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('收到WebSocket消息:', data);
    
    switch (data.type) {
      case 'text':
      case 'image':
      case 'file':
      case 'question_bank':
        handleNewMessage(data);
        break;
      case 'status':
        updateFriendStatus(data.userId, data.status === 'online');
        break;
      case 'friend_request_count':
        handleFriendRequestCount(data.count);
        break;
      case 'new_friend_request':
        handleNewFriendRequest(data.fromUser);
        break;
      case 'friendship_update':
        handleFriendshipUpdate(data.action);
        break;
      case 'friend_deleted':
        handleFriendDeleted(data.friendId);
        break;
      case 'group_message':
        handleGroupMessage(data);
        break;
      case 'group_created':
        groups.value.push(data.group);
        break;
    }
  };

  ws.value.onclose = () => {
    console.log('WebSocket连接已断开，尝试重连...');
    // 标记所有好友为离线
    friends.value.forEach(friend => {
      friend.online = false;
    });
    setTimeout(connectWebSocket, 3000); // 3秒后重连
  };

  ws.value.onerror = (error) => {
    console.error('WebSocket错误:', error);
  };
};

// 处理新消息
// 处理群组消息
const handleGroupMessage = (message) => {
  if (currentGroup.value?.id === message.groupId) {
    messages.value.push({
      ...message,
      fromUser: message.fromUser
    })
    scrollToBottom()
    
    // 标记消息为已读
    if (message.id) {
      axios.put(`/api/group_messages/read/${message.id}`).catch(console.error)
    }
  } else {
    // 更新群组未读计数
    const group = groups.value.find(g => g.id === message.groupId)
    if (group) {
      group.unreadCount = (group.unreadCount || 0) + 1
      message.info(`收到来自群组 ${group.name} 的新消息`)
    }
  }
}

const handleNewMessage = (message) => {
  console.log('处理新消息:', message);
  
  // 如果消息是发给当前聊天的好友或者是自己发送的消息
  if (currentFriend.value && 
      (message.fromUserId === currentFriend.value.id || 
       message.fromUserId === userStore.id)) {
    // 添加消息到列表
    const processedMessage = {
      ...message,
      fromUser: message.fromUserId === userStore.id ? {
        id: userStore.id,
        username: userStore.username,
        nickname: userStore.nickname,
        avatar: userStore.avatar
      } : {
        id: currentFriend.value.id,
        username: currentFriend.value.username,
        nickname: currentFriend.value.nickname,
        avatar: currentFriend.value.avatar
      }
    };

    // 如果是题库消息，确保内容被正确解析
    if (message.type === 'question_bank' && typeof message.content === 'string') {
      try {
        const parsedContent = JSON.parse(message.content);
        processedMessage.parsedBanks = parsedContent.map(bank => ({
          ...bank,
          accepted: false
        }));
      } catch (error) {
        console.error('解析题库消息失败:', error);
      }
    }

    messages.value.push(processedMessage);
    scrollToBottom();
    
    // 标记消息为已读
    if (message.id && message.fromUserId !== userStore.id) {
      axios.put(`/api/messages/read/${message.id}`).catch(console.error);
    }
  } else {
    // 如果不是当前聊天窗口，增加未读消息计数
    const friend = friends.value.find(f => f.id === message.fromUserId);
    if (friend) {
      friend.unreadCount = (friend.unreadCount || 0) + 1;
      // 显示消息提醒
      message.info(`收到来自 ${friend.nickname || friend.username} 的新消息`);
    }
  }
};

// 更新好友在线状态
const updateFriendStatus = (friendId, isOnline) => {
  const friend = friends.value.find(f => f.id === friendId)
  if (friend) {
    friend.online = isOnline
  }
}

// 选择好友
const selectFriend = async (friend) => {
  currentFriend.value = friend
  messages.value = []
  
  try {
    // 获取聊天记录
    const response = await axios.get(`/api/messages/history/${friend.id}`)
    if (response.data.success) {
      messages.value = response.data.data
    }
    
    // 标记消息为已读
    if (friend.unreadCount > 0) {
      await axios.put(`/api/messages/read/${friend.id}`)
      friend.unreadCount = 0
    }
    
    scrollToBottom()
  } catch (error) {
    message.error('获取聊天记录失败')
  }
}

// 发送消息
const handleSend = async (messageData) => {
  if ((!currentFriend.value && !currentGroup.value) || currentFriend.value?.isDeleted) return;

  try {
    let message = currentGroup.value ? {
      type: messageData.type,
      content: messageData.content,
      metadata: messageData.metadata,
      fromUserId: userStore.id,
      groupId: currentGroup.value.id,
      create_time: new Date().toISOString(),
      fromUser: {
        id: userStore.id,
        username: userStore.username,
        nickname: userStore.nickname,
        avatar: userStore.avatar
      }
    } : {
      type: messageData.type,
      content: messageData.content,
      metadata: messageData.metadata,
      fromUserId: userStore.id,
      toUserId: currentFriend.value.id,
      create_time: new Date().toISOString(),
      fromUser: {
        id: userStore.id,
        username: userStore.username,
        nickname: userStore.nickname,
        avatar: userStore.avatar
      }
    };

    // 添加到消息列表（乐观更新）
    messages.value.push(message);
    nextTick(() => {
      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
      }
    });

    // 通过WebSocket发送消息
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(message));
    } else {
      message.error('消息发送失败，请检查网络连接');
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    message.error('发送消息失败');
  }
};

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}

// 搜索用户
const handleSearch = async () => {
  if (!searchText.value) return
  
  try {
    const [searchResponse, friendsResponse] = await Promise.all([
      axios.get(`/api/friends/search?username=${searchText.value}`),
      axios.get('/api/friends/list')
    ])

    if (searchResponse.data.success) {
      // 为搜索结果添加状态标记
      searchResults.value = searchResponse.data.data.map(user => ({
        ...user,
        isFriend: friendsResponse.data.data.some(friend => friend.id === user.id),
        hasSentRequest: false // 将在发送请求后更新
      }))
      searchModalVisible.value = true
    }
  } catch (error) {
    message.error('搜索用户失败')
  }
}

// 处理好友请求数量
const handleFriendRequestCount = (count) => {
  if (count > 0) {
    fetchFriendRequests()
  }
}

// 处理新的好友请求
const handleNewFriendRequest = (fromUser) => {
  message.info(`收到来自 ${fromUser.nickname || fromUser.username} 的好友请求`)
  fetchFriendRequests()
}

// 发送好友请求
const sendFriendRequest = async (friendId) => {
  try {
    const response = await axios.post('/api/friends/request', { friendId })
    if (response.data.success) {
      // 更新搜索结果中的状态
      const userIndex = searchResults.value.findIndex(user => user.id === friendId)
      if (userIndex !== -1) {
        searchResults.value[userIndex].hasSentRequest = true
      }
      message.success('好友请求已发送，等待对方验证')
      searchModalVisible.value = false
    }
  } catch (error) {
    if (error.response?.status === 400) {
      message.warning(error.response.data.message)
    } else {
      message.error('发送好友请求失败')
    }
  }
}

// 处理好友关系更新
const handleFriendshipUpdate = (action) => {
  if (action === 'accepted') {
    fetchFriends() // 重新获取好友列表
  }
}

// 处理好友请求
const handleRequest = async (requestId, status) => {
  try {
    const response = await axios.put(`/api/friends/request/${requestId}`, { status })
    if (response.data.success) {
      message.success(status === 'accepted' ? '已接受好友请求' : '已拒绝好友请求')
      friendRequests.value = friendRequests.value.filter(r => r.id !== requestId)
      
      if (status === 'accepted' && response.data.data) {
        // 直接添加新好友到列表
        friends.value.push({
          id: response.data.data.id,
          username: response.data.data.username,
          nickname: response.data.data.nickname,
          avatar: response.data.data.avatar,
          online: false // 默认离线，等待WebSocket更新状态
        })
      }
    }
  } catch (error) {
    message.error('处理好友请求失败')
  }
}

// 显示修改备注弹窗
const showEditNickname = (friend) => {
  selectedFriend.value = friend
  newNickname.value = friend.nickname || ''
  nicknameModalVisible.value = true
}

// 更新好友备注
const handleUpdateNickname = async () => {
  try {
    const response = await axios.put(`/api/friends/nickname/${selectedFriend.value.id}`, {
      nickname: newNickname.value
    })
    if (response.data.success) {
      selectedFriend.value.nickname = newNickname.value
      message.success('备注修改成功')
      nicknameModalVisible.value = false
    }
  } catch (error) {
    message.error('修改备注失败')
  }
}

// 处理好友删除
const handleFriendDeleted = (friendId) => {
  const friend = friends.value.find(f => f.id === friendId);
  if (friend) {
    friend.isDeleted = true;
    message.error(`${friend.nickname || friend.username} 已将你从好友列表中删除`);
    if (currentFriend.value?.id === friendId) {
      currentFriend.value = null;
    }
  }
}

// 删除好友
const handleDeleteFriend = async (friend) => {
  try {
    const response = await axios.delete(`/api/friends/${friend.id}`)
    if (response.data.success) {
      message.success('好友删除成功')
      friends.value = friends.value.filter(f => f.id !== friend.id)
      if (currentFriend.value?.id === friend.id) {
        currentFriend.value = null
      }
    }
  } catch (error) {
    message.error('删除好友失败')
  }
}

// 格式化时间
const formatTime = (time) => {
  return new Date(time).toLocaleString()
}

// 获取好友列表
const fetchFriends = async () => {
  try {
    const response = await axios.get('/api/friends/list')
    if (response.data.success) {
      friends.value = response.data.data.map(friend => ({
        ...friend,
        online: false,
        unreadCount: 0
      }))
    }
  } catch (error) {
    message.error('获取好友列表失败')
  }
}

// 获取好友请求
const fetchFriendRequests = async () => {
  try {
    const response = await axios.get('/api/friends/requests')
    if (response.data.success) {
      friendRequests.value = response.data.data
    }
  } catch (error) {
    message.error('获取好友请求失败')
  }
}

const showRequestsModal = () => {
  requestsModalVisible.value = true;
}

// 在script setup部分添加handleEnterPress函数
const handleEnterPress = (e) => {
  // 如果是按下Shift+Enter，则换行
  if (e.shiftKey) {
    return;
  }
  // 阻止默认行为并发送消息
  e.preventDefault();
  sendMessage();
};

// 图片预览
const showPreviewImage = (url) => {
  previewImage.value = url;
  previewVisible.value = true;
};

// 处理图片上传
const handleImageUpload = async (file) => {
  if (!file.type.startsWith('image/')) {
    message.error('只能上传图片文件！');
    return false;
  }

  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    message.error('图片大小不能超过5MB！');
    return false;
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data.success) {
      // 发送图片消息
      sendMessage({
        type: 'image',
        content: response.data.data.url,
        metadata: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      });
    }
  } catch (error) {
    console.error('上传图片失败:', error);
    message.error('上传图片失败');
  }
  return false;
};

// 处理文件上传
const handleFileUpload = async (file) => {
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    message.error('文件大小不能超过10MB！');
    return false;
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data.success) {
      // 发送文件消息
      sendMessage({
        type: 'file',
        content: response.data.data.url,
        metadata: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      });
    }
  } catch (error) {
    console.error('上传文件失败:', error);
    message.error('上传文件失败');
  }
  return false;
};

// 下载文件
const downloadFile = (msg) => {
  const link = document.createElement('a');
  link.href = msg.content;
  link.download = msg.originalName || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 解析题库消息内容
const parseQuestionBanks = (content) => {
  if (!content) return [];
  
  try {
    if (typeof content === 'string') {
      return JSON.parse(content).map(bank => ({
        ...bank,
        accepted: false
      }));
    } else if (Array.isArray(content)) {
      return content.map(bank => ({
        ...bank,
        accepted: false
      }));
    }
    return [];
  } catch (error) {
    console.error('解析题库消息失败:', error);
    return [];
  }
};

// 处理接受题库
const handleAcceptBank = async (bank, fromUserId) => {
  try {
    const response = await axios.post('/api/question-banks/accept', {
      bankIds: [bank.id],
      fromUserId
    });
    
    if (response.data.success) {
      bank.accepted = true;
      message.success('题库添加成功');
    }
  } catch (error) {
    message.error('添加题库失败');
  }
};

onMounted(() => {
  // 先获取好友列表、群组列表和请求
  Promise.all([
    fetchFriends(),
    fetchGroups(),
    fetchFriendRequests()
  ]).then(() => {
    // 然后建立WebSocket连接
    connectWebSocket();
  }).catch(error => {
    console.error('初始化失败:', error);
    message.error('初始化失败，请刷新页面重试');
  });
})

onUnmounted(() => {
  if (ws.value) {
    ws.value.close();
    ws.value = null;
  }
})
</script>

<style scoped>
.chat-container {
  height: 100%;
  padding: 24px;
  background: #f0f2f5;
}

.chat-layout {
  height: calc(100vh - 200px);
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.friend-list {
  height: 100%;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
}

.friend-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.friend-requests {
  padding: 8px 16px;
  cursor: pointer;
}

.friend-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.friend-item {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.friend-item:hover {
  background: #f5f5f5;
}

.friend-item.active {
  background: #e6f7ff;
}

.friend-item.deleted {
  opacity: 0.7;
  background: #fafafa;
}

.friend-item.deleted:hover {
  background: #f5f5f5;
}

.group-item {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
}

.group-item:hover {
  background: #f5f5f5;
}

.group-item.active {
  background: #e6f7ff;
}

.group-info {
  margin-left: 12px;
  flex: 1;
  min-width: 0;
}

.group-name {
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.group-members {
  font-size: 12px;
  color: #999;
}

.friend-info {
  margin-left: 12px;
  flex: 1;
  min-width: 0;
}

.friend-name {
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.friend-status {
  font-size: 12px;
  color: #999;
}

.friend-status.online {
  color: #52c41a;
}

.chat-main {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 500;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message-item {
  margin-bottom: 16px;
}

.message-content {
  display: flex;
  align-items: flex-start;
}

.message-content.message-self {
  flex-direction: row-reverse;
}

.message-bubble {
  max-width: 60%;
  margin: 0 12px;
  padding: 8px 12px;
  background: #f0f2f5;
  border-radius: 12px;
  position: relative;
  word-break: break-all;
}

.message-self .message-bubble {
  background: #1890ff;
  color: #fff;
}

.group-message .message-bubble {
  background: #f0f2f5;
  border: 1px solid #d9d9d9;
}

.message-sender {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  padding-left: 44px;
}

.group-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.group-create {
  padding: 8px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.message-image {
  max-width: 300px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.3s;
}

.message-image:hover {
  transform: scale(1.02);
}

.message-bubble.image-message {
  padding: 4px;
  background: transparent;
}

.message-self .message-bubble.image-message {
  background: transparent;
}

.message-self .message-bubble .message-image {
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  text-align: right;
}

.message-self .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.file-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.file-message:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 12px;
  color: #999;
}

.message-self .file-message {
  color: #fff;
}

.message-self .file-size {
  color: rgba(255, 255, 255, 0.8);
}

.unread-count {
  background: #ff4d4f;
  color: #fff;
  padding: 0 6px;
  border-radius: 10px;
  font-size: 12px;
  margin-left: 8px;
  line-height: 1.5;
}

.chat-input {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

.input-toolbar {
  margin-bottom: 8px;
  display: flex;
  gap: 8px;
}

.input-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

.input-tip {
  color: #ff4d4f;
  margin-right: 12px;
  font-size: 12px;
}

.chat-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.request-list {
  max-height: 400px;
  overflow-y: auto;
}

.request-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.request-item:last-child {
  border-bottom: none;
}

.request-info {
  flex: 1;
  margin: 0 12px;
}

.request-name {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
}

.request-time {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.request-actions {
  display: flex;
  gap: 8px;
}

.friend-remark {
  font-size: 12px;
  color: #999;
  margin-left: 4px;
}

.search-list {
  max-height: 400px;
  overflow-y: auto;
}

.search-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.search-item:last-child {
  border-bottom: none;
}

.search-info {
  flex: 1;
  margin: 0 12px;
}

.search-name {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
}

.friend-deleted {
  margin-left: 4px;
  display: inline-flex;
  align-items: center;
}

.message-error {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
}

.message-content.message-temp {
  opacity: 0.7;
}

.message-image {
  max-width: 300px;
  max-height: 300px;
  border-radius: 4px;
  cursor: pointer;
}

.input-toolbar {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.file-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f0f2f5;
  border-radius: 4px;
  cursor: pointer;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 12px;
  color: #666;
}

.message-self .file-message {
  background: #1890ff;
  color: #fff;
}

.message-self .file-name {
  color: #fff;
}

.question-bank-message {
  background: #f0f2f5;
  border-radius: 8px;
  padding: 12px;
  max-width: 300px;
}

.message-self .question-bank-message {
  background: #e6f7ff;
}

.bank-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bank-item {
  background: #fff;
  border-radius: 4px;
  padding: 12px;
}

.bank-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.bank-icon {
  color: #1890ff;
  font-size: 20px;
}

.bank-name {
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bank-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bank-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bank-count {
  font-size: 12px;
  color: #999;
}
</style>
