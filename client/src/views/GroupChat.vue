<template>
  <div class="group-chat-container">
    <!-- 左侧群组列表 -->
    <div class="group-list">
      <div class="group-list-header">
        <span>我的群聊</span>
        <div class="group-actions">
          <a-badge :count="groupRequests.length" :dot="true" v-if="hasManageableGroups">
            <a-button type="link" @click="showGroupRequestsModal">
              <template #icon>
                <notification-outlined />
              </template>
            </a-button>
          </a-badge>
          <a-button type="primary" @click="showCreateGroupModal">
            创建群组
          </a-button>
        </div>
      </div>
      <div class="group-list-content">
        <a-list :data-source="groups">
          <template #renderItem="{ item }">
            <a-list-item 
              class="group-item" 
              :class="{ 'selected': selectedGroup?.id === item.id }"
              @click="selectGroup(item)"
            >
              <div class="group-info">
                <a-badge :count="item.unreadCount || 0">
                  <a-avatar :src="item.avatar">
                    {{ item.name.substring(0, 1) }}
                  </a-avatar>
                </a-badge>
                <div class="group-detail">
                  <div class="group-name">{{ item.name }}</div>
                  <div class="group-desc">{{ item.description || '暂无描述' }}</div>
                </div>
              </div>
            </a-list-item>
          </template>
        </a-list>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="chat-area">
      <template v-if="selectedGroup">
        <div class="chat-header">
          <div class="chat-title">
            <span>{{ selectedGroup.name }}</span>
            <a-button type="link" @click="showGroupInfo">群组信息</a-button>
          </div>
        </div>
        
        <!-- 添加群公告组件 -->
        <div class="announcement-section" v-if="selectedGroup">
          <div class="announcement-header" @click="toggleAnnouncement">
            <notification-outlined />
            <span class="announcement-title">群公告</span>
            <down-outlined :class="{ 'rotate-icon': !isAnnouncementCollapsed }" />
          </div>
          <div class="announcement-content" :class="{ 'collapsed': isAnnouncementCollapsed }">
            <div class="announcement-text">
              {{ selectedGroup.announcement || '暂无公告' }}
              <a-button 
                v-if="isOwner" 
                type="link" 
                size="small"
                @click="showEditAnnouncement"
              >
                编辑
              </a-button>
            </div>
          </div>
        </div>
        
        <div class="message-list" ref="messageListRef">
          <div v-for="message in messages" :key="message.id" class="message-item">
            <div :class="['message-content', message.from_user_id === userStore.id ? 'self' : '']">
              <a-avatar 
                :src="message.fromUser?.avatar"
                :size="40"
              >
                {{ message.fromUser?.nickname?.substring(0, 1) || message.fromUser?.username?.substring(0, 1) }}
              </a-avatar>
              <div class="message-bubble">
                <div class="message-sender" v-if="message.from_user_id !== userStore.id">
                  {{ message.fromUser?.nickname || message.fromUser?.username }}
                </div>
                <div class="message-text">
                  <template v-if="message.type === 'text'">
                    {{ message.content }}
                  </template>
                  <template v-else-if="message.type === 'image'">
                    <img :src="message.content" class="message-image" @click="previewImage(message.content)" />
                  </template>
                  <template v-else-if="message.type === 'file'">
                    <div class="file-message">
                      <file-outlined />
                      <a :href="message.content" target="_blank">
                        {{ message.metadata?.name || '文件' }}
                      </a>
                    </div>
                  </template>
                  <template v-else-if="message.type === 'question_bank'">
                    <div class="question-bank-message">
                      <a-card size="small" :bordered="false" class="bank-card">
                        <template #title>
                          <div class="bank-header">
                            <book-outlined />
                            <span class="bank-title">题库分享</span>
                          </div>
                        </template>
                        <div class="bank-content">
                          <div v-for="bank in JSON.parse(message.content)" :key="bank.id" class="bank-item">
                            <div class="bank-name">{{ bank.name }}</div>
                            <div class="bank-info">
                              <span>题目数量: {{ bank.questionCount }}</span>
                            </div>
                          </div>
                        </div>
                        <template #extra>
                          <a-button 
                            type="link" 
                            size="small"
                            @click="handleAcceptBank(JSON.parse(message.content), message.from_user_id)"
                          >
                            添加到我的题库
                          </a-button>
                        </template>
                      </a-card>
                    </div>
                  </template>
                </div>
                <div class="message-time">{{ formatTime(message.create_time) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="input-area">
          <div class="toolbar">
            <a-tooltip title="发送图片">
              <a-upload
                accept="image/*"
                :show-upload-list="false"
                :before-upload="beforeImageUpload"
                :customRequest="handleImageUpload"
              >
                <a-button type="text">
                  <template #icon>
                    <PictureOutlined />
                  </template>
                </a-button>
              </a-upload>
            </a-tooltip>

            <a-tooltip title="发送文件">
              <a-upload
                :show-upload-list="false"
                :before-upload="beforeFileUpload"
                :customRequest="handleFileUpload"
              >
                <a-button type="text">
                  <template #icon>
                    <PaperClipOutlined />
                  </template>
                </a-button>
              </a-upload>
            </a-tooltip>

            <a-tooltip title="分享题库">
              <a-button type="text" @click="showQuestionBankModal">
                <template #icon>
                  <BookOutlined />
                </template>
              </a-button>
            </a-tooltip>

            <a-tooltip title="查看文件">
              <a-button type="text" @click="showFileListModal">
                <template #icon>
                  <FolderOutlined />
                </template>
              </a-button>
            </a-tooltip>

            <a-tooltip title="编辑群公告" v-if="isOwner">
              <a-button type="text" @click="showEditAnnouncement">
                <template #icon>
                  <NotificationOutlined />
                </template>
              </a-button>
            </a-tooltip>
          </div>
          <a-textarea
            v-model:value="inputMessage"
            :rows="3"
            placeholder="输入消息..."
            @keypress.enter.prevent="handleSend({ type: 'text', content: inputMessage })"
          />
          <a-button type="primary" @click="handleSend({ type: 'text', content: inputMessage })">
            发送
          </a-button>
        </div>
      </template>
      <div v-else class="no-chat-selected">
        请选择一个群组开始聊天
      </div>
    </div>

    <!-- 创建群组对话框 -->
    <a-modal
      v-model:open="createGroupModalVisible"
      title="创建群组"
      @ok="handleCreateGroup"
      :confirmLoading="creating"
      width="500px"
    >
      <a-form :model="groupForm">
        <a-form-item label="群组名称" required>
          <a-input v-model:value="groupForm.name" placeholder="请输入群组名称" />
        </a-form-item>
        <a-form-item label="群组描述">
          <a-textarea v-model:value="groupForm.description" placeholder="请输入群组描述" :rows="4" />
        </a-form-item>
        <a-form-item label="选择成员" required>
          <div class="friend-selection">
            <a-checkbox-group v-model:value="selectedFriendsForCreate">
              <div class="friend-list">
                <a-checkbox 
                  v-for="friend in friendsList" 
                  :key="friend.key" 
                  :value="friend.key"
                  class="friend-item"
                >
                  <div class="friend-info">
                    <a-avatar :size="24" :src="friend.avatar">
                      {{ friend.title.substring(0, 1) }}
                    </a-avatar>
                    <span class="friend-name">{{ friend.title }}</span>
                  </div>
                </a-checkbox>
              </div>
            </a-checkbox-group>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 群组信息对话框 -->
    <a-modal
      v-model:open="groupInfoModalVisible"
      title="群组信息"
      width="600px"
      :footer="null"
    >
      <template v-if="selectedGroup">
        <div class="group-info">
          <a-upload
            name="avatar"
            :show-upload-list="false"
            :before-upload="beforeUpload"
            :customRequest="handleAvatarUpload"
            v-if="isOwnerOrAdmin"
          >
            <div class="avatar-wrapper">
              <a-avatar :size="64" :src="selectedGroup.avatar">
                {{ selectedGroup.name.substring(0, 1) }}
              </a-avatar>
              <div class="avatar-mask">
                <camera-outlined />
                <span>更换头像</span>
              </div>
            </div>
          </a-upload>
          <a-avatar v-else :size="64" :src="selectedGroup.avatar">
            {{ selectedGroup.name.substring(0, 1) }}
          </a-avatar>
          <div class="group-detail">
            <h3>{{ selectedGroup.name }}</h3>
            <p>{{ selectedGroup.description || '暂无群描述' }}</p>
          </div>
        </div>

        <a-divider />

        <div class="member-list">
          <h4>群成员 ({{ selectedGroup.members?.length || 0 }})</h4>
          <a-list :data-source="selectedGroup.members">
            <template #renderItem="{ item }">
              <a-list-item>
                <div class="member-info">
                  <a-avatar :src="item.user.avatar">
                    {{ item.user.nickname?.substring(0, 1) || item.user.username.substring(0, 1) }}
                  </a-avatar>
                  <span class="member-name">
                    {{ item.nickname || item.user.nickname || item.user.username }}
                  </span>
                  <a-tag v-if="item.role === 'owner'" color="red">群主</a-tag>
                  <a-tag v-else-if="item.role === 'admin'" color="blue">管理员</a-tag>
                </div>
              </a-list-item>
            </template>
          </a-list>
        </div>

        <a-divider />

        <div class="group-actions">
          <a-space>
            <a-button 
              danger 
              @click="handleQuitGroup"
              :disabled="isOwner"
            >
              {{ isOwner ? '群主不能退出群组' : '退出群组' }}
            </a-button>
            <a-button 
              type="primary" 
              @click="showInviteModal"
              v-if="isOwnerOrAdmin"
            >
              邀请好友
            </a-button>
          </a-space>
        </div>
      </template>
    </a-modal>

    <!-- 邀请好友对话框 -->
    <a-modal
      v-model:open="inviteModalVisible"
      title="邀请好友"
      @ok="handleInvite"
      :confirmLoading="inviting"
      width="500px"
    >
      <a-form-item label="选择好友" required>
        <div class="friend-selection">
          <a-checkbox-group v-model:value="selectedFriends">
            <div class="friend-list">
              <a-checkbox 
                v-for="friend in friendsData" 
                :key="friend.key" 
                :value="friend.key"
                class="friend-item"
              >
                <div class="friend-info">
                  <a-avatar :size="24" :src="friend.avatar">
                    {{ friend.title.substring(0, 1) }}
                  </a-avatar>
                  <span class="friend-name">{{ friend.title }}</span>
                </div>
              </a-checkbox>
            </div>
          </a-checkbox-group>
        </div>
      </a-form-item>
    </a-modal>

    <!-- 群组申请审核对话框 -->
    <a-modal
      v-model:open="groupRequestsModalVisible"
      title="入群申请"
      :footer="null"
    >
      <a-list :data-source="groupRequests">
        <template #renderItem="{ item }">
          <a-list-item>
            <div class="request-item">
              <a-avatar :size="40" :src="item.user.avatar">
                {{ item.user.nickname?.substring(0, 1) || item.user.username?.substring(0, 1) }}
              </a-avatar>
              <div class="request-info">
                <div class="request-name">
                  {{ item.user.nickname || item.user.username }}
                </div>
                <div class="request-time">{{ formatTime(item.create_time) }}</div>
              </div>
              <div class="request-actions">
                <a-button type="primary" size="small" @click="handleGroupRequest(item.id, 'accepted')">
                  同意
                </a-button>
                <a-button size="small" @click="handleGroupRequest(item.id, 'rejected')" style="margin-left: 8px;">
                  拒绝
                </a-button>
              </div>
            </div>
          </a-list-item>
        </template>
      </a-list>
    </a-modal>

    <!-- 题库选择对话框 -->
    <a-modal
      v-model:open="questionBankModalVisible"
      title="分享题库"
      @ok="handleQuestionBankSelect"
      :maskClosable="false"
    >
      <a-spin :spinning="loadingQuestionBanks">
        <a-list :data-source="myQuestionBanks" class="question-bank-list">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-checkbox v-model:checked="selectedQuestionBanks[item.id]">
                <div class="bank-info">
                  <div class="bank-name">{{ item.name }}</div>
                  <div class="bank-desc">{{ item.description || '暂无描述' }}</div>
                  <div class="bank-stats">
                    题目数量: {{ item.questionCount }}
                  </div>
                </div>
              </a-checkbox>
            </a-list-item>
          </template>
        </a-list>
      </a-spin>
    </a-modal>

    <!-- 文件列表对话框 -->
    <a-modal
      v-model:open="fileListModalVisible"
      title="群文件"
      width="800px"
      :footer="null"
    >
      <a-tabs v-model:activeKey="activeFileTab">
        <a-tab-pane key="all" tab="全部">
          <a-spin :spinning="loadingFiles">
            <a-list :data-source="fileList" class="file-list">
              <template #renderItem="{ item }">
                <a-list-item>
                  <div class="file-item">
                    <div class="file-icon">
                      <PictureOutlined v-if="item.type === 'image'" />
                      <FileOutlined v-else-if="item.type === 'file'" />
                      <BookOutlined v-else-if="item.type === 'question_bank'" />
                    </div>
                    <div class="file-info">
                      <div class="file-name">
                        <template v-if="item.type === 'image'">
                          <img :src="item.content" class="file-thumbnail" @click="previewImage(item.content)" />
                        </template>
                        <template v-else-if="item.type === 'file'">
                          <a :href="item.content" target="_blank">{{ item.metadata?.name || '文件' }}</a>
                        </template>
                        <template v-else-if="item.type === 'question_bank'">
                          <span>{{ JSON.parse(item.content)[0]?.name || '题库' }}</span>
                        </template>
                      </div>
                      <div class="file-meta">
                        <span>{{ item.fromUser?.nickname || item.fromUser?.username }}</span>
                        <span>{{ formatTime(item.create_time) }}</span>
                      </div>
                    </div>
                    <div class="file-actions">
                      <a-button 
                        type="link" 
                        v-if="item.type === 'question_bank'"
                        @click="handleAcceptBank(JSON.parse(item.content), item.from_user_id)"
                      >
                        添加到我的题库
                      </a-button>
                      <a-button 
                        type="link" 
                        v-else
                        @click="downloadFile(item)"
                      >
                        下载
                      </a-button>
                    </div>
                  </div>
                </a-list-item>
              </template>
            </a-list>
          </a-spin>
        </a-tab-pane>
        <a-tab-pane key="images" tab="图片">
          <a-spin :spinning="loadingFiles">
            <div class="image-grid">
              <div v-for="item in fileList.filter(f => f.type === 'image')" :key="item.id" class="image-item">
                <img :src="item.content" @click="previewImage(item.content)" />
              </div>
            </div>
          </a-spin>
        </a-tab-pane>
        <a-tab-pane key="files" tab="文件">
          <a-spin :spinning="loadingFiles">
            <a-list :data-source="fileList.filter(f => f.type === 'file')">
              <template #renderItem="{ item }">
                <a-list-item>
                  <div class="file-item">
                    <FileOutlined />
                    <div class="file-info">
                      <a :href="item.content" target="_blank">{{ item.metadata?.name || '文件' }}</a>
                      <div class="file-meta">
                        <span>{{ item.fromUser?.nickname || item.fromUser?.username }}</span>
                        <span>{{ formatTime(item.create_time) }}</span>
                      </div>
                    </div>
                  </div>
                </a-list-item>
              </template>
            </a-list>
          </a-spin>
        </a-tab-pane>
        <a-tab-pane key="question_banks" tab="题库">
          <a-spin :spinning="loadingFiles">
            <a-list :data-source="fileList.filter(f => f.type === 'question_bank')">
              <template #renderItem="{ item }">
                <a-list-item>
                  <div class="file-item">
                    <BookOutlined />
                    <div class="file-info">
                      <div class="bank-name">{{ JSON.parse(item.content)[0]?.name || '题库' }}</div>
                      <div class="file-meta">
                        <span>{{ item.fromUser?.nickname || item.fromUser?.username }}</span>
                        <span>{{ formatTime(item.create_time) }}</span>
                      </div>
                    </div>
                    <a-button 
                      type="link"
                      @click="handleAcceptBank(JSON.parse(item.content), item.from_user_id)"
                    >
                      添加到我的题库
                    </a-button>
                  </div>
                </a-list-item>
              </template>
            </a-list>
          </a-spin>
        </a-tab-pane>
      </a-tabs>
    </a-modal>

    <!-- 编辑公告对话框 -->
    <a-modal
      v-model:open="announcementModalVisible"
      title="编辑群公告"
      @ok="handleEditAnnouncement"
      :confirmLoading="editingAnnouncement"
    >
      <a-form :model="announcementForm">
        <a-form-item>
          <a-textarea
            v-model:value="announcementForm.announcement"
            :rows="4"
            placeholder="请输入群公告"
            :maxlength="500"
            show-count
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import axios from 'axios';
import { useUserStore } from '../store/user';
import { wsClient } from '../utils/websocket';
import MessageItem from '../components/chat/MessageItem.vue';
import MessageInput from '../components/chat/MessageInput.vue';
import { NotificationOutlined, CameraOutlined, PictureOutlined, FileOutlined, BookOutlined, PaperClipOutlined, FolderOutlined, EditOutlined, DownOutlined } from '@ant-design/icons-vue';

const userStore = useUserStore();
const groups = ref([]);
const selectedGroup = ref(null);
const messages = ref([]);
const messageListRef = ref(null);
const inputMessage = ref('');
const createGroupModalVisible = ref(false);
const groupInfoModalVisible = ref(false);
const inviteModalVisible = ref(false);
const creating = ref(false);
const inviting = ref(false);
const groupRequestsModalVisible = ref(false);
const searchedGroup = ref(null);
const groupRequests = ref([]);
const questionBankModalVisible = ref(false);
const activeQuestionBankTab = ref('my');
const myQuestionBanks = ref([]);
const publicQuestionBanks = ref([]);
const selectedQuestionBanks = ref({});
const loadingQuestionBanks = ref(false);
const selectedFriends = ref([]);
const friendsData = ref([]);

// 添加是否有可管理群组的计算属性
const hasManageableGroups = computed(() => {
  return groups.value.some(group => {
    const member = group.members?.find(m => m.user_id === userStore.id);
    return member?.role === 'owner' || member?.role === 'admin';
  });
});

const groupForm = ref({
  name: '',
  description: ''
});

const isOwner = computed(() => {
  if (!selectedGroup.value) return false;
  return selectedGroup.value.owner_id === userStore.id;
});

const isOwnerOrAdmin = computed(() => {
  if (!selectedGroup.value) return false;
  const member = selectedGroup.value.members?.find(m => m.user_id === userStore.id);
  return member?.role === 'owner' || member?.role === 'admin';
});

// 添加未读消息计数的状态
const unreadCounts = ref({});

// 添加群公告相关的状态
const isAnnouncementCollapsed = ref(true);
const announcementModalVisible = ref(false);
const editingAnnouncement = ref(false);
const announcementForm = ref({
  announcement: ''
});

// 在 script setup 中添加
const updateReadStatus = async (groupId) => {
  try {
    await axios.put(`/api/groups/${groupId}/read`);
    // 更新本地未读计数
    const index = groups.value.findIndex(g => g.id === groupId);
    if (index !== -1) {
      groups.value[index].unreadCount = 0;
    }
  } catch (error) {
    console.error('更新已读状态失败:', error);
  }
};

// 修改 selectGroup 方法
const selectGroup = async (group) => {
  selectedGroup.value = group;
  
  try {
    // 获取群消息
    const response = await axios.get(`/api/groups/${group.id}/messages`);
    if (response.data.success) {
      messages.value = response.data.data;
      await nextTick();
      scrollToBottom();
      
      // 只有当有未读消息时才更新已读状态
      if (group.unreadCount > 0) {
        await updateReadStatus(group.id);
        // 更新本地未读计数
        const index = groups.value.findIndex(g => g.id === group.id);
        if (index !== -1) {
          groups.value[index].unreadCount = 0;
        }
      }
    }
  } catch (error) {
    console.error('获取群消息失败:', error);
    message.error('获取群消息失败');
  }
};

// 修改 fetchGroups 方法
const fetchGroups = async () => {
  try {
    const response = await axios.get('/api/groups/list');
    if (response.data.success) {
      groups.value = response.data.data;
    }
  } catch (error) {
    console.error('获取群组列表失败:', error);
    message.error('获取群组列表失败');
  }
};

// 显示创建群组对话框
const showCreateGroupModal = () => {
  // 重置表单状态
  groupForm.value = {
    name: '',
    description: ''
  };
  selectedFriendsForCreate.value = [];
  createGroupModalVisible.value = true;
  // 获取好友列表
  fetchFriendsList();
};

// 添加好友列表相关的状态
const friendsList = ref([]);
const selectedFriendsForCreate = ref([]);

// 添加获取好友列表的方法
const fetchFriendsList = async () => {
  try {
    const response = await axios.get('/api/friends/list');
    if (response.data.success) {
      friendsList.value = response.data.data.map(friend => ({
        key: friend.id.toString(),
        title: friend.nickname || friend.username,
        description: friend.signature || '暂无签名',
        ...friend
      }));
    }
  } catch (error) {
    message.error('获取好友列表失败');
  }
};

// 修改创建群组的方法
const handleCreateGroup = async () => {
  if (!groupForm.value.name) {
    message.warning('请输入群组名称');
    return;
  }

  if (selectedFriendsForCreate.value.length === 0) {
    message.warning('请选择至少一个好友');
    return;
  }

  creating.value = true;
  try {
    // 创建群组
    const response = await axios.post('/api/groups', {
      name: groupForm.value.name,
      description: groupForm.value.description,
      memberIds: selectedFriendsForCreate.value.map(id => parseInt(id, 10))
    });

    if (response.data.success) {
      message.success('创建成功');
      createGroupModalVisible.value = false;
      groupForm.value = { name: '', description: '' };
      selectedFriendsForCreate.value = [];
      await fetchGroups();
    }
  } catch (error) {
    console.error('创建群组失败:', error);
    message.error('创建群组失败');
  } finally {
    creating.value = false;
  }
};

// 修改发送消息的方法
const handleSend = (messageData) => {
  if (!selectedGroup.value) return;

  const messageId = Date.now().toString();
  const newMessage = {
    messageId,
    type: messageData.type,
    content: messageData.content,
    groupId: selectedGroup.value.id,
    from_user_id: userStore.id,
    timestamp: Date.now(),
    create_time: new Date().toISOString(),
    status: 'pending',
    fromUser: {
      id: userStore.id,
      username: userStore.username,
      nickname: userStore.nickname,
      avatar: userStore.avatar
    },
    metadata: messageData.metadata || {}
  };

  // 立即添加到本地消息列表
  messages.value = [...messages.value, newMessage];
  
  // 清空输入框
  inputMessage.value = '';
  
  // 使用 nextTick 确保在 DOM 更新后滚动
  nextTick(() => {
    scrollToBottom();
  });

  // 发送到服务器
  wsClient.sendMessage(messageData.type, newMessage);
};

// 优化滚动到底部的方法
const scrollToBottom = () => {
  if (messageListRef.value) {
    const scrollElement = messageListRef.value;
    scrollElement.scrollTop = scrollElement.scrollHeight;
  }
};

// 监听消息列表变化，自动滚动到底部
watch(() => messages.value.length, () => {
  nextTick(() => {
    scrollToBottom();
  });
});

// 显示群组信息
const showGroupInfo = async () => {
  try {
    const response = await axios.get(`/api/groups/${selectedGroup.value.id}`);
    if (response.data.success) {
      selectedGroup.value = response.data.data;
      groupInfoModalVisible.value = true;
    }
  } catch (error) {
    message.error('获取群组信息失败');
  }
};

// 退出群组
const handleQuitGroup = async () => {
  try {
    await axios.delete(`/api/groups/${selectedGroup.value.id}/members`);
    message.success('退出成功');
    groupInfoModalVisible.value = false;
    selectedGroup.value = null;
    await fetchGroups();
  } catch (error) {
    message.error('退出群组失败');
  }
};

// 显示邀请对话框
const showInviteModal = async () => {
  try {
    // 获取好友列表
    const response = await axios.get('/api/friends/list');
    if (response.data.success) {
      // 过滤掉已经在群组中的好友
      const groupMemberIds = selectedGroup.value.members.map(m => m.user_id);
      friendsData.value = response.data.data
        .filter(friend => !groupMemberIds.includes(friend.id))
        .map(friend => ({
          key: friend.id.toString(),
          title: friend.nickname || friend.username,
          description: friend.signature || '暂无签名',
          avatar: friend.avatar
        }));
      selectedFriends.value = [];
      inviteModalVisible.value = true;
    }
  } catch (error) {
    console.error('获取好友列表失败:', error);
    message.error('获取好友列表失败');
  }
};

// 修改邀请好友的方法
const handleInvite = async () => {
  if (!selectedFriends.value || selectedFriends.value.length === 0) {
    message.warning('请选择要邀请的好友');
    return;
  }

  inviting.value = true;
  try {
    const response = await axios.post(`/api/groups/${selectedGroup.value.id}/members`, {
      userIds: selectedFriends.value.map(id => parseInt(id, 10))
    });

    if (response.data.success) {
      message.success('邀请成功');
      inviteModalVisible.value = false;
      selectedFriends.value = [];
      await showGroupInfo();
    }
  } catch (error) {
    console.error('邀请失败:', error);
    message.error(error.response?.data?.message || '邀请失败');
  } finally {
    inviting.value = false;
  }
};

// 搜索过滤
const filterOption = (inputValue, option) => {
  return option.title.toLowerCase().indexOf(inputValue.toLowerCase()) > -1;
};

// 表格行选择配置
const getRowSelection = ({ disabled, selectedKeys, onItemSelectAll, onItemSelect }) => {
  return {
    getCheckboxProps: item => ({
      disabled: disabled || item.disabled,
    }),
    onSelectAll(selected, selectedRows) {
      const treeSelectedKeys = selectedRows
        .filter(item => !item.disabled)
        .map(({ key }) => key);
      onItemSelectAll(treeSelectedKeys, selected);
    },
    onSelect({ key }, selected) {
      onItemSelect(key, selected);
    },
    selectedRowKeys: selectedKeys,
  };
};

// 修改获取未读消息数的方法
const fetchUnreadCounts = async () => {
  if (!userStore.token) return; // 如果没有token，不获取未读消息数
  
  try {
    const response = await axios.get('/api/groups/unread', {
      headers: {
        Authorization: `Bearer ${userStore.token}`
      }
    });
    if (response.data.success) {
      // 更新群组列表中的未读消息数
      const unreadData = response.data.data;
      groups.value = groups.value.map(group => ({
        ...group,
        unreadCount: unreadData.find(item => item.groupId === group.id)?.count || 0
      }));
    }
  } catch (error) {
    if (error.response?.status !== 403) { // 只有非403错误才记录
      console.error('获取未读消息数失败:', error);
    }
  }
};

// 修改WebSocket消息监听逻辑
['text', 'image', 'file', 'question_bank'].forEach(type => {
  wsClient.onMessage(type, async (data) => {
    console.log('收到消息:', data);
    if (data.groupId) {
      // 如果消息不是来自当前用户
      if (data.fromUserId !== userStore.id) {
        // 如果当前没有选中群组，或者消息不是来自当前选中的群组
        if (!selectedGroup.value || selectedGroup.value.id !== data.groupId) {
          // 增加未读消息计数
          unreadCounts.value[data.groupId] = (unreadCounts.value[data.groupId] || 0) + 1;
          // 更新群组列表中的未读计数
          const index = groups.value.findIndex(g => g.id === data.groupId);
          if (index !== -1) {
            groups.value[index].unreadCount = unreadCounts.value[data.groupId];
          }
        } else {
          // 如果是当前选中的群组，立即更新已读状态
          try {
            await axios.put(`/api/groups/messages/${data.groupId}/read`);
          } catch (error) {
            console.error('更新消息已读状态失败:', error);
          }
        }
      }
      
      // 如果当前选中的群组是消息的目标群组，或者消息来自当前用户
      if (selectedGroup.value?.id === data.groupId || data.fromUserId === userStore.id) {
        const existingMessage = messages.value.find(m => m.messageId === data.messageId);
        if (!existingMessage) {
          const newMessage = {
            ...data,
            id: data.messageId,
            fromUser: data.fromUser || {
              id: data.fromUserId,
              username: data.fromUser?.username,
              nickname: data.fromUser?.nickname,
              avatar: data.fromUser?.avatar
            },
            create_time: data.create_time || new Date(data.timestamp).toISOString(),
            type: data.type,
            content: data.content,
            metadata: data.metadata || {}
          };
          
          messages.value.push(newMessage);
          nextTick(() => scrollToBottom());
        }
      }
    }
  });
});

wsClient.onMessage('message_status', (data) => {
  const index = messages.value.findIndex(m => m.messageId === data.messageId);
  if (index !== -1) {
    messages.value[index].status = data.status;
    if (data.status === 'error' && data.error) {
      message.error(`消息发送失败: ${data.error}`);
    }
  }
});

// 添加时间格式化函数
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 添加图片预览功能
const previewImage = (url) => {
  // 使用 ant-design-vue 的图片预览组件
  const images = [{ src: url }];
  const imagePreview = document.$preview.show({
    images,
    current: 0
  });
};

// 显示群组申请对话框
const showGroupRequestsModal = () => {
  groupRequestsModalVisible.value = true;
  fetchGroupRequests();
};

// 修改获取群组申请列表的方法
const fetchGroupRequests = async () => {
  try {
    const response = await axios.get('/api/groups/requests');
    if (response.data.success) {
      groupRequests.value = response.data.data;
      console.log('获取到的群组申请:', groupRequests.value);
    }
  } catch (error) {
    console.error('获取群组申请列表失败:', error);
  }
};

// 修改处理群组申请的方法
const handleGroupRequest = async (requestId, action) => {
  try {
    const response = await axios.put(`/api/groups/requests/${requestId}`, {
      action
    });

    if (response.data.success) {
      message.success(action === 'accepted' ? '已同意申请' : '已拒绝申请');
      // 刷新申请列表
      await fetchGroupRequests();
      // 如果同意申请，刷新群组列表
      if (action === 'accepted') {
        await fetchGroups();
      }
    }
  } catch (error) {
    console.error('处理群组申请失败:', error);
    message.error('处理申请失败');
  }
};

// 修改监听群组申请通知的逻辑
wsClient.onMessage('group_request', (data) => {
  console.log('收到新的群组申请:', data);
  // 刷新申请列表
  fetchGroupRequests();
  // 显示通知
  message.info(`收到来自 ${data.user.nickname || data.user.username} 的入群申请`);
});

// 头像上传前的校验
const beforeUpload = (file) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJpgOrPng) {
    message.error('只能上传 JPG/PNG 格式的图片！');
    return false;
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB！');
    return false;
  }
  return true;
};

// 自定义上传方法
const handleAvatarUpload = async ({ file }) => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await axios.post(
      `/api/groups/${selectedGroup.value.id}/avatar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    if (response.data.success) {
      selectedGroup.value.avatar = response.data.data.avatar;
      message.success('群头像更新成功');
    }
  } catch (error) {
    console.error('上传群头像失败:', error);
    message.error('上传群头像失败');
  }
};

// 图片上传前的校验
const beforeImageUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件！');
    return false;
  }
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    message.error('图片大小不能超过 5MB！');
    return false;
  }
  return true;
};

// 处理图片上传
const handleImageUpload = ({ file }) => {
  if (file.status === 'done') {
    const response = file.response;
    if (response.success) {
      // 发送图片消息
      handleSend({
        type: 'image',
        content: response.data.url,
        metadata: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      });
    } else {
      message.error('图片上传失败');
    }
  } else if (file.status === 'error') {
    message.error('图片上传失败');
  }
};

// 文件上传前的校验
const beforeFileUpload = (file) => {
  const isLt50M = file.size / 1024 / 1024 < 50;
  if (!isLt50M) {
    message.error('文件大小不能超过 50MB！');
    return false;
  }
  return true;
};

// 处理文件上传
const handleFileUpload = ({ file }) => {
  if (file.status === 'done') {
    const response = file.response;
    if (response.success) {
      // 发送文件消息
      handleSend({
        type: 'file',
        content: response.data.url,
        metadata: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      });
    } else {
      message.error('文件上传失败');
    }
  } else if (file.status === 'error') {
    message.error('文件上传失败');
  }
};

// 显示题库选择对话框
const showQuestionBankModal = async () => {
  questionBankModalVisible.value = true;
  loadingQuestionBanks.value = true;
  try {
    const response = await axios.get('/api/question-banks/my');
    if (response.data.success) {
      myQuestionBanks.value = response.data.data;
      selectedQuestionBanks.value = {};
    } else {
      message.error('获取题库列表失败');
    }
  } catch (error) {
    console.error('获取题库列表失败:', error);
    message.error('获取题库列表失败');
  } finally {
    loadingQuestionBanks.value = false;
  }
};

// 处理题库选择
const handleQuestionBankSelect = async () => {
  const selectedBanks = Object.entries(selectedQuestionBanks.value)
    .filter(([_, selected]) => selected)
    .map(([id]) => parseInt(id));
    
  if (selectedBanks.length === 0) {
    message.warning('请选择至少一个题库');
    return;
  }
  
  try {
    // 获取选中题库的详细信息
    const response = await axios.post('/api/question-banks/details', {
      bankIds: selectedBanks
    });
    
    if (response.data.success) {
      // 发送题库消息
      handleSend({
        type: 'question_bank',
        content: JSON.stringify(response.data.data),
        metadata: {
          bankIds: selectedBanks
        }
      });
      
      questionBankModalVisible.value = false;
      selectedQuestionBanks.value = {};
    }
  } catch (error) {
    console.error('获取题库详情失败:', error);
    message.error('发送题库失败');
  }
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// 下载文件
const downloadFile = (message) => {
  if (message.type === 'file') {
    window.open(message.content, '_blank');
  }
};

// 在组件挂载时初始化未读消息计数
onMounted(async () => {
  await fetchGroups();
  await fetchUnreadCounts();

  // 监听新消息
  wsClient.onMessage('group_message', async (data) => {
    // 如果消息不是当前选中的群组，增加未读计数
    if (data.group_id !== selectedGroup.value?.id) {
      const groupIndex = groups.value.findIndex(g => g.id === data.group_id);
      if (groupIndex !== -1) {
        groups.value[groupIndex].unreadCount = (groups.value[groupIndex].unreadCount || 0) + 1;
      }
    }

    // 如果是当前选中的群组，添加消息到列表
    if (data.group_id === selectedGroup.value?.id) {
      messages.value.push(data);
      await nextTick();
      scrollToBottom();
    }
  });

  if (hasManageableGroups.value) {
    await fetchGroupRequests();
  }
});

// 添加定期刷新未读消息数的功能
let unreadCountsInterval;

onMounted(() => {
  // 每30秒刷新一次未读消息数
  unreadCountsInterval = setInterval(fetchUnreadCounts, 30000);
});

onUnmounted(() => {
  // 清理定时器
  if (unreadCountsInterval) {
    clearInterval(unreadCountsInterval);
  }
});

// 处理接受题库
const handleAcceptBank = async (banks, fromUserId) => {
  try {
    // 如果 banks 是数组，直接使用；如果是单个对象，转换为数组
    const bankIds = Array.isArray(banks) ? banks.map(bank => bank.id) : [banks.id];
    
    const response = await axios.post('/api/question-banks/accept', {
      bankIds,
      fromUserId
    });
    
    if (response.data.success) {
      message.success('题库添加成功');
      // 如果是数组，更新每个题库的状态
      if (Array.isArray(banks)) {
        banks.forEach(bank => bank.accepted = true);
      } else {
        banks.accepted = true;
      }
    }
  } catch (error) {
    console.error('添加题库失败:', error);
    message.error('添加题库失败');
  }
};

// 添加文件列表相关方法
const showFileListModal = async () => {
  if (!selectedGroup.value) return;
  
  fileListModalVisible.value = true;
  loadingFiles.value = true;
  
  try {
    // 获取当前群组的所有消息
    const response = await axios.get(`/api/groups/${selectedGroup.value.id}/messages`);
    if (response.data.success) {
      // 过滤出文件类型的消息
      fileList.value = response.data.data.filter(msg => 
        ['image', 'file', 'question_bank'].includes(msg.type)
      );
    }
  } catch (error) {
    console.error('获取文件列表失败:', error);
    message.error('获取文件列表失败');
  } finally {
    loadingFiles.value = false;
  }
};

// 切换公告折叠状态
function toggleAnnouncement() {
  isAnnouncementCollapsed.value = !isAnnouncementCollapsed.value;
}

// 显示编辑公告对话框
function showEditAnnouncement() {
  announcementForm.value.announcement = selectedGroup.value.announcement || '';
  announcementModalVisible.value = true;
}

// 处理编辑公告
async function handleEditAnnouncement() {
  if (!selectedGroup.value) return;
  
  editingAnnouncement.value = true;
  try {
    const response = await axios.put(`/api/groups/${selectedGroup.value.id}/announcement`, {
      announcement: announcementForm.value.announcement
    });
    
    if (response.data.success) {
      message.success('群公告更新成功');
      announcementModalVisible.value = false;
    }
  } catch (error) {
    message.error('更新群公告失败');
  } finally {
    editingAnnouncement.value = false;
  }
}

// 监听群公告更新
wsClient.onMessage('announcement_update', (data) => {
  if (selectedGroup.value && data.groupId === selectedGroup.value.id) {
    selectedGroup.value.announcement = data.announcement;
  }
});
</script>

<style scoped>
.group-chat-container {
  display: flex;
  height: calc(100vh - 64px);
  background: #f0f2f5;
}

.group-list {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
}

.group-list-header {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-list-content {
  flex: 1;
  overflow-y: auto;
}

.group-item {
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.group-item:hover {
  background-color: #f5f5f5;
}

.group-avatar {
  margin-right: 12px;
}

.group-info {
  flex: 1;
  overflow: hidden;
}

.group-name {
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-desc {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected {
  background: #e6f7ff;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
}

.chat-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}

.message-list {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #f5f5f5;
}

.message-item {
  margin-bottom: 20px;
}

.message-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.message-content.self {
  flex-direction: row-reverse;
}

.message-bubble {
  max-width: 60%;
  padding: 12px 16px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.message-content.self .message-bubble {
  background: #e6f7ff;
}

.message-sender {
  font-size: 13px;
  color: #00000073;
  margin-bottom: 4px;
}

.message-text {
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.message-time {
  font-size: 12px;
  color: #00000040;
  margin-top: 4px;
  text-align: right;
}

.message-image {
  max-width: 300px;
  max-height: 300px;
  border-radius: 8px;
  cursor: pointer;
}

.input-area {
  padding: 16px;
  background: #fff;
  border-top: 1px solid #e8e8e8;
}

.toolbar {
  margin-bottom: 8px;
}

.input-area .ant-textarea {
  margin-bottom: 8px;
  border-radius: 4px;
  resize: none;
}

.input-area .ant-btn {
  float: right;
}

.no-chat-selected {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  color: #00000073;
}

.file-message {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-message a {
  color: #1890ff;
  text-decoration: none;
}

.file-message a:hover {
  text-decoration: underline;
}

/* 美化滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #00000026;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #00000040;
}

.group-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

:deep(.ant-badge) {
  margin-right: 8px;
}

.searched-group {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-top: 16px;
}

.searched-group-info {
  margin-left: 12px;
}

.searched-group-name {
  font-weight: 500;
  color: #000000d9;
}

.searched-group-desc {
  font-size: 12px;
  color: #00000073;
  margin-top: 4px;
}

.request-item {
  display: flex;
  align-items: center;
  width: 100%;
}

.request-info {
  flex: 1;
  margin-left: 12px;
}

.request-name {
  font-weight: 500;
  color: #000000d9;
}

.request-time {
  font-size: 12px;
  color: #00000073;
  margin-top: 4px;
}

.request-actions {
  display: flex;
  gap: 8px;
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
  display: inline-block;
}

.avatar-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-wrapper:hover .avatar-mask {
  opacity: 1;
}

.avatar-mask .anticon {
  font-size: 20px;
  margin-bottom: 4px;
}

.avatar-mask span {
  font-size: 12px;
}

.group-info {
  display: flex;
  align-items: center;
  width: 100%;
}

.group-detail {
  margin-left: 12px;
  flex: 1;
  overflow: hidden;
}

.group-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-desc {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.ant-badge-count) {
  background: #ff4d4f;
  box-shadow: 0 0 0 1px #fff;
}

.question-bank-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  background: #f5f5f5;
  margin-bottom: 8px;
}

.question-bank-info {
  flex: 1;
  margin-right: 16px;
}

.question-bank-name {
  font-weight: 500;
  font-size: 16px;
  color: #000000d9;
  margin-bottom: 4px;
}

.question-bank-desc {
  font-size: 14px;
  color: #00000073;
}

.file-message {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.file-message:hover {
  background: #e6f7ff;
}

.file-info {
  margin-left: 8px;
}

.file-name {
  font-weight: 500;
  margin-bottom: 2px;
}

.file-meta {
  font-size: 12px;
  color: #999;
  display: flex;
  gap: 16px;
}

.file-thumbnail {
  max-width: 100px;
  max-height: 100px;
  border-radius: 4px;
  cursor: pointer;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  padding: 16px;
}

.image-item {
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
    
    &:hover {
      transform: scale(1.05);
    }
  }
}

.bank-name {
  font-weight: 500;
  margin-bottom: 4px;
}

/* 添加群公告相关样式 */
.announcement-section {
  background: #f8f8f8;
  border-radius: 4px;
  margin: 8px;
  transition: all 0.3s ease;
}

.announcement-header {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  user-select: none;
  color: #666;
  font-size: 13px;
}

.announcement-header:hover {
  background: #f0f0f0;
}

.announcement-title {
  margin: 0 8px;
  flex: 1;
}

.rotate-icon {
  transform: rotate(180deg);
}

.announcement-content {
  max-height: 200px;
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease;
  padding: 0 12px 8px;
}

.announcement-content.collapsed {
  max-height: 0;
  padding: 0 12px;
}

.announcement-text {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  word-break: break-all;
}

.down-outlined {
  transition: transform 0.3s ease;
}

/* 工具栏按钮样式优化 */
.toolbar {
  display: flex;
  gap: 8px;
  padding: 8px;
}

.toolbar .ant-btn {
  padding: 4px 8px;
}

.toolbar .anticon {
  font-size: 20px;
  color: #00000073;
  transition: color 0.3s;
}

.toolbar .ant-btn:hover .anticon {
  color: #1890ff;
}

.friend-selection {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 8px;
}

.friend-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 4px 8px;
}

.friend-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
}

.friend-name {
  font-size: 14px;
  color: #000000d9;
}
</style> 