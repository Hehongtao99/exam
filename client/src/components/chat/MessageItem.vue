<template>
  <div class="message-item" :class="{ 'message-mine': isMine }">
    <div class="message-avatar">
      <a-avatar :src="message.fromUser?.avatar">
        {{ message.fromUser?.nickname?.substring(0, 1) || message.fromUser?.username?.substring(0, 1) }}
      </a-avatar>
    </div>
    
    <div class="message-content">
      <div class="message-name">
        {{ message.fromUser?.nickname || message.fromUser?.username }}
      </div>
      
      <!-- 文本消息 -->
      <div v-if="message.type === 'text'" class="message-text">
        {{ message.content }}
        <div class="message-actions">
          <a-dropdown placement="bottomRight" :trigger="['click']" @click.stop>
            <a-button type="text" class="action-button">
              <template #icon>
                <span class="anticon">
                  <svg viewBox="64 64 896 896" focusable="false" data-icon="ellipsis" width="1em" height="1em" fill="currentColor">
                    <path d="M176 511a56 56 0 10112 0 56 56 0 10-112 0zm280 0a56 56 0 10112 0 56 56 0 10-112 0zm280 0a56 56 0 10112 0 56 56 0 10-112 0z"></path>
                  </svg>
                </span>
              </template>
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="handleCopy">
                  <template #icon>
                    <span class="anticon">
                      <svg viewBox="64 64 896 896" focusable="false" data-icon="copy" width="1em" height="1em" fill="currentColor">
                        <path d="M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2L263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z"></path>
                      </svg>
                    </span>
                  </template>
                  复制
                </a-menu-item>
                <a-menu-item @click="handleForward">
                  <template #icon>
                    <span class="anticon">
                      <svg viewBox="64 64 896 896" focusable="false" data-icon="forward" width="1em" height="1em" fill="currentColor">
                        <path d="M825.8 498L538.4 249.9c-10.7-9.2-26.4-.9-26.4 14v496.3c0 14.9 15.7 23.2 26.4 14L825.8 526c8.3-7.2 8.3-20.8 0-28zm-320 0L218.4 249.9c-10.7-9.2-26.4-.9-26.4 14v496.3c0 14.9 15.7 23.2 26.4 14L505.8 526c4.1-3.6 6.2-8.8 6.2-14 0-5.2-2.1-10.4-6.2-14z"></path>
                      </svg>
                    </span>
                  </template>
                  转发
                </a-menu-item>
                <a-menu-item danger @click="handleDelete">
                  <template #icon>
                    <span class="anticon">
                      <svg viewBox="64 64 896 896" focusable="false" data-icon="delete" width="1em" height="1em" fill="currentColor">
                        <path d="M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z"></path>
                      </svg>
                    </span>
                  </template>
                  删除
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>
      
      <!-- 图片消息 -->
      <div v-else-if="message.type === 'image'" class="message-image">
        <a-image
          :src="message.content"
          :preview="{
            src: message.content,
            mask: false
          }"
        >
          <template #placeholder>
            <div class="image-loading">
              <a-spin />
            </div>
          </template>
        </a-image>
      </div>
      
      <!-- 文件消息 -->
      <div v-else-if="message.type === 'file'" class="message-file">
        <a :href="message.content" target="_blank" class="file-link">
          <span class="file-icon">
            <svg viewBox="64 64 896 896" focusable="false" data-icon="file" width="1em" height="1em" fill="currentColor"><path d="M534 352V136H232v752h560V394H576a42 42 0 01-42-42z"></path><path d="M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM602 137.8L790.2 326H602V137.8zM792 888H232V136h302v216a42 42 0 0042 42h216v494z"></path></svg>
          </span>
          <div class="file-info">
            <div class="file-name">{{ message.metadata?.name || '未知文件' }}</div>
            <div class="file-size">{{ formatFileSize(message.metadata?.size) }}</div>
          </div>
        </a>
      </div>
      
      <!-- 题库消息 -->
      <div v-else-if="message.type === 'question_bank'" class="message-question-bank">
        <div class="bank-list">
          <div v-for="bank in parsedBanks" :key="bank.id" class="bank-item">
            <div class="bank-header">
              <span class="bank-icon">
                <svg viewBox="64 64 896 896" focusable="false" data-icon="book" width="1em" height="1em" fill="currentColor"><path d="M832 64H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-260 72h96v209.9L621.5 312 572 347.4V136zm220 752H232V136h280v296.9c0 3.3 1 6.6 3 9.3a15.9 15.9 0 0022.3 3.7l83.8-59.9 81.4 59.4c2.7 2 6 3.1 9.4 3.1 8.8 0 16-7.2 16-16V136h64v752z"></path></svg>
              </span>
              <span class="bank-name">{{ bank.name }}</span>
            </div>
            <div class="bank-desc">{{ bank.description || '暂无描述' }}</div>
            <div class="bank-footer">
              <span class="bank-count">题目数量: {{ bank.questionCount }}</span>
              <a-button 
                type="link" 
                size="small"
                @click="handleAcceptBank(bank)"
                :disabled="bank.accepted"
              >
                {{ bank.accepted ? '已添加' : '添加到我的题库' }}
              </a-button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="message-time">
        {{ formatTime(message.create_time || message.timestamp) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useUserStore } from '../../store/user';
import axios from 'axios';

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
});

const userStore = useUserStore();

const isMine = computed(() => {
  return props.message.fromUserId === userStore.id;
});

const parsedBanks = computed(() => {
  if (props.message.type !== 'question_bank') return [];
  try {
    return JSON.parse(props.message.content).map(bank => ({
      ...bank,
      accepted: false
    }));
  } catch (error) {
    return [];
  }
});

const handleAcceptBank = async (bank) => {
  try {
    const response = await axios.post('/api/question-banks/accept', {
      bankIds: [bank.id],
      fromUserId: props.message.fromUserId
    });
    
    if (response.data.success) {
      bank.accepted = true;
      message.success('题库添加成功');
    }
  } catch (error) {
    message.error('添加题库失败');
  }
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '未知大小';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 复制消息
const handleCopy = () => {
  navigator.clipboard.writeText(props.message.content)
    .then(() => {
      message.success('复制成功');
    })
    .catch(() => {
      message.error('复制失败');
    });
};

// 转发消息
const handleForward = () => {
  // TODO: 实现转发功能
  message.info('转发功能开发中');
};

// 删除消息
const handleDelete = () => {
  // TODO: 实现删除功能
  message.info('删除功能开发中');
};
</script>

<style scoped>
.message-item {
  display: flex;
  margin-bottom: 16px;
  align-items: flex-start;
}

.message-mine {
  flex-direction: row-reverse;
}

.message-avatar {
  margin: 0 12px;
}

.message-content {
  max-width: 60%;
}

.message-mine .message-content {
  text-align: right;
}

.message-name {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.message-text {
  position: relative;
  background: #f0f2f5;
  padding: 8px 12px;
  border-radius: 8px;
  word-break: break-all;
  white-space: pre-wrap;
}

.message-mine .message-text {
  background: #e6f7ff;
}

.message-image {
  max-width: 300px;
  border-radius: 8px;
  overflow: hidden;
}

.message-image img {
  max-width: 100%;
  height: auto;
}

.image-loading {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.message-file {
  background: #f0f2f5;
  padding: 12px;
  border-radius: 8px;
  max-width: 300px;
}

.message-mine .message-file {
  background: #e6f7ff;
}

.file-link {
  display: flex;
  align-items: center;
  color: inherit;
  text-decoration: none;
}

.file-icon {
  font-size: 24px;
  margin-right: 12px;
  color: #1890ff;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 12px;
  color: #999;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.message-question-bank {
  background: #f0f2f5;
  border-radius: 8px;
  overflow: hidden;
  max-width: 300px;
}

.message-mine .message-question-bank {
  background: #e6f7ff;
}

.bank-list {
  padding: 8px;
}

.bank-item {
  background: #fff;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 8px;
}

.bank-item:last-child {
  margin-bottom: 0;
}

.bank-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.bank-icon {
  font-size: 20px;
  color: #1890ff;
  margin-right: 8px;
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

:deep(.ant-btn-link) {
  padding: 0;
}

.message-actions {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.3s;
}

.message-mine .message-actions {
  left: -24px;
}

.message-item:not(.message-mine) .message-actions {
  right: -24px;
}

.message-text:hover .message-actions {
  opacity: 1;
}

.action-button {
  color: #999;
  padding: 4px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.action-button:hover {
  color: #1890ff;
  background: #fff;
}

:deep(.ant-dropdown-menu-item) {
  min-width: 120px;
  padding: 8px 12px;
}

:deep(.ant-dropdown-menu-item .anticon) {
  margin-right: 8px;
}
</style> 