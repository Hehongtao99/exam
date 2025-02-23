<template>
  <div class="friend-chat">
    <div class="chat-header">
      <div class="friend-info">
        <span class="friend-name">{{ friend.nickname || friend.username }}</span>
        <span class="friend-status" :class="{ online: friend.online }">
          {{ friend.online ? '在线' : '离线' }}
        </span>
      </div>
    </div>

    <div class="chat-messages" ref="messagesRef">
      <div v-for="message in messages" :key="message.messageId" class="message-item">
        <MessageItem :message="message" />
      </div>
    </div>

    <div class="chat-input">
      <MessageInput @send="handleSend" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import axios from 'axios';
import MessageItem from './MessageItem.vue';
import MessageInput from './MessageInput.vue';
import { wsClient } from '../../utils/websocket';
import { useUserStore } from '@/store/user';

const props = defineProps({
  friend: {
    type: Object,
    required: true
  }
});

const messages = ref([]);
const messagesRef = ref(null);
const userStore = useUserStore();

// 获取聊天历史
const fetchMessages = async () => {
  try {
    const response = await axios.get(`/api/messages/history/${props.friend.id}`);
    if (response.data.success) {
      messages.value = response.data.data.map(msg => {
        // 确保 fromUser 数据完整
        let fromUser = msg.fromUser;
        if (!fromUser) {
          if (msg.fromUserId === userStore.id) {
            fromUser = {
              id: userStore.id,
              username: userStore.username,
              nickname: userStore.nickname,
              avatar: userStore.avatar
            };
          } else {
            // 假设 friend 对象中包含了对方的完整信息
            fromUser = {
              id: props.friend.id,
              username: props.friend.username,
              nickname: props.friend.nickname,
              avatar: props.friend.avatar
            };
          }
        }
        return {
          ...msg,
          messageId: msg.messageId || msg.id.toString(),
          fromUser,
          timestamp: new Date(msg.create_time).getTime()
        };
      });
      console.log('获取到的聊天记录:', messages.value);
      await nextTick();
      scrollToBottom();
    }
  } catch (error) {
    console.error('获取聊天记录失败:', error);
    message.error('获取聊天记录失败');
  }
};

// 发送消息
const handleSend = (messageData) => {
  console.log('发送消息:', messageData);
  const newMessage = {
    type: messageData.type || 'text',
    content: messageData.content,
    toUserId: props.friend.id,
    fromUserId: userStore.id,
    timestamp: Date.now(),
    fromUser: {
      id: userStore.id,
      username: userStore.username,
      nickname: userStore.nickname,
      avatar: userStore.avatar
    }
  };

  const messageId = wsClient.sendMessage(newMessage.type, newMessage);

  // 添加到消息列表（乐观更新）
  messages.value.push({
    ...newMessage,
    messageId,
    create_time: new Date().toISOString(),
    status: 'pending'
  });

  nextTick(() => scrollToBottom());
};

// 滚动到底部
const scrollToBottom = () => {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
  }
};

// 监听好友变化
watch(() => props.friend?.id, (newId) => {
  if (newId) {
    fetchMessages();
  }
});

// 监听WebSocket消息
['text', 'image', 'file', 'voice', 'emoji'].forEach(type => {
  wsClient.onMessage(type, (data) => {
    console.log(`收到消息 ${type}:`, data);
    if (data.fromUserId === props.friend?.id || data.toUserId === props.friend?.id) {
      const existingMessage = messages.value.find(m => m.messageId === data.messageId);
      if (!existingMessage) {
        // 确保 fromUser 数据完整
        let fromUser = data.fromUser;
        if (!fromUser) {
          if (data.fromUserId === userStore.id) {
            fromUser = {
              id: userStore.id,
              username: userStore.username,
              nickname: userStore.nickname,
              avatar: userStore.avatar
            };
          } else {
            // 假设 friend 对象中包含了对方的完整信息
            fromUser = {
              id: props.friend.id,
              username: props.friend.username,
              nickname: props.friend.nickname,
              avatar: props.friend.avatar
            };
          }
        }
        const newMessage = {
          ...data,
          type: data.type, // 关键修改：将原始消息的 type 属性赋值给 newMessage
          create_time: data.create_time || new Date(data.timestamp).toISOString(),
          fromUser
        };
        console.log('添加新消息:', newMessage);
        // 调试信息：检查 newMessage 的 type 和 content 属性
        console.log('newMessage.type:', newMessage.type);
        console.log('newMessage.content:', newMessage.content);
        messages.value.push(newMessage);
        nextTick(() => scrollToBottom());
      }
    }
  });
});

// 监听好友在线状态
wsClient.onMessage('status', (data) => {
  console.log('收到状态更新:', data);
  if (data.userId === props.friend?.id) {
    props.friend.online = data.status === 'online';
  }
});

wsClient.onMessage('message_status', (data) => {
  console.log('收到消息状态更新:', data);
  const index = messages.value.findIndex(m => m.messageId === data.messageId);
  if (index !== -1) {
    messages.value[index].status = data.status;
    if (data.status === 'error' && data.error) {
      message.error(`消息发送失败: ${data.error}`);
    }
  }
});

onMounted(() => {
  if (props.friend?.id) {
    fetchMessages();
  }
});
</script>

<style scoped>
/* 样式保持不变 */
.friend-chat {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.friend-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.friend-name {
  font-size: 16px;
  font-weight: 500;
}

.friend-status {
  font-size: 12px;
  color: #999;
}

.friend-status.online {
  color: #52c41a;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message-item {
  margin-bottom: 16px;
}

.chat-input {
  border-top: 1px solid #f0f0f0;
}
</style>
