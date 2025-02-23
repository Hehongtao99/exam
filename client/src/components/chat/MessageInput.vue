<template>
  <div class="message-input">
    <div class="input-toolbar">
      <a-space>
        <a-tooltip title="发送图片">
          <a-upload
            accept="image/*"
            :show-upload-list="false"
            :before-upload="handleImageUpload"
            :disabled="props.disabled"
          >
            <a-button type="text" :disabled="props.disabled">
              <template #icon>
                <span class="anticon">
                  <svg viewBox="64 64 896 896" focusable="false" data-icon="picture" width="20px" height="20px" fill="currentColor"><path d="M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32zM338 304c35.3 0 64 28.7 64 64s-28.7 64-64 64-64-28.7-64-64 28.7-64 64-64zm513.9 437.1a8.11 8.11 0 01-5.2 1.9H177.2c-4.4 0-8-3.6-8-8 0-1.9.7-3.7 1.9-5.2l170.3-202c2.8-3.4 7.9-3.8 11.3-1 .3.3.7.6 1 1l99.4 118 158.1-187.5c2.8-3.4 7.9-3.8 11.3-1 .3.3.7.6 1 1l229.6 271.6c2.6 3.3 2.2 8.4-1.2 11.2z"></path></svg>
                </span>
              </template>
            </a-button>
          </a-upload>
        </a-tooltip>

        <a-tooltip title="发送文件">
          <a-upload
            :show-upload-list="false"
            :before-upload="handleFileUpload"
            :disabled="props.disabled"
          >
            <a-button type="text" :disabled="props.disabled">
              <template #icon>
                <span class="anticon">
                  <svg viewBox="64 64 896 896" focusable="false" data-icon="paper-clip" width="20px" height="20px" fill="currentColor"><path d="M779.3 196.6c-94.2-94.2-247.6-94.2-341.7 0l-261 260.8c-1.7 1.7-2.6 4-2.6 6.4s.9 4.7 2.6 6.4l36.9 36.9a9 9 0 0012.7 0l261-260.8c32.4-32.4 75.5-50.2 121.3-50.2s88.9 17.8 121.2 50.2c32.4 32.4 50.2 75.5 50.2 121.2 0 45.8-17.8 88.8-50.2 121.2l-266 265.9-43.1 43.1c-40.3 40.3-105.8 40.3-146.1 0-19.5-19.5-30.2-45.4-30.2-73s10.7-53.5 30.2-73l263.9-263.8c6.7-6.6 15.5-10.3 24.9-10.3h.1c9.4 0 18.1 3.7 24.7 10.3 6.7 6.7 10.3 15.5 10.3 24.9 0 9.3-3.7 18.1-10.3 24.7L372.4 653c-1.7 1.7-2.6 4-2.6 6.4s.9 4.7 2.6 6.4l36.9 36.9a9 9 0 0012.7 0l215.6-215.6c19.9-19.9 30.8-46.3 30.8-74.4s-11-54.6-30.8-74.4c-41.1-41.1-107.9-41-149 0L463 364 224.8 602.1A172.22 172.22 0 00160 725.3c0 46.3 18.1 89.8 50.8 122.5 33.9 33.8 78.3 50.7 122.7 50.7 44.4 0 88.8-16.9 122.6-50.7l309.2-309C824.8 479.2 850 420.4 850 355.5s-25.2-123.7-70.7-158.9z"></path></svg>
                </span>
              </template>
            </a-button>
          </a-upload>
        </a-tooltip>

        <a-tooltip title="分享题库">
          <a-button type="text" @click="showQuestionBankModal" :disabled="props.disabled">
            <template #icon>
              <span class="anticon">
                <svg viewBox="64 64 896 896" focusable="false" data-icon="book" width="20px" height="20px" fill="currentColor"><path d="M832 64H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-260 72h96v209.9L621.5 312 572 347.4V136zm220 752H232V136h280v296.9c0 3.3 1 6.6 3 9.3a15.9 15.9 0 0022.3 3.7l83.8-59.9 81.4 59.4c2.7 2 6 3.1 9.4 3.1 8.8 0 16-7.2 16-16V136h64v752z"></path></svg>
              </span>
            </template>
          </a-button>
        </a-tooltip>
      </a-space>
    </div>

    <div class="input-area">
      <a-textarea
        v-model:value="inputText"
        :rows="3"
        placeholder="请输入消息"
        @keydown.enter.prevent="handleSend"
        :disabled="props.disabled"
      />
    </div>

    <div class="input-actions">
      <a-button type="primary" @click="handleSend" :disabled="props.disabled || !inputText.trim()">发送</a-button>
    </div>

    <!-- 题库选择弹窗 -->
    <a-modal
      v-model:open="questionBankModalVisible"
      title="分享题库"
      @ok="handleShareQuestionBank"
    >
      <a-spin :spinning="loading">
        <a-list :data-source="questionBanks" class="question-bank-list">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-checkbox v-model:checked="selectedBanks[item.id]">
                <div class="bank-info">
                  <div class="bank-name">{{ item.name }}</div>
                  <div class="bank-desc">{{ item.description || '暂无描述' }}</div>
                  <div class="bank-stats">
                    题目数量: {{ item.questions?.length || 0 }}
                  </div>
                </div>
              </a-checkbox>
            </a-list-item>
          </template>
        </a-list>
      </a-spin>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { message } from 'ant-design-vue';
import axios from 'axios';

const emit = defineEmits(['send']);
const inputText = ref('');
const questionBankModalVisible = ref(false);
const loading = ref(false);
const questionBanks = ref([]);
const selectedBanks = reactive({});

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
});

// 显示题库选择弹窗
const showQuestionBankModal = async () => {
  loading.value = true;
  questionBankModalVisible.value = true;
  try {
    const response = await axios.get('/api/question-banks');
    if (response.data.success) {
      questionBanks.value = response.data.data;
    }
  } catch (error) {
    message.error('获取题库列表失败');
  } finally {
    loading.value = false;
  }
};

// 处理题库分享
const handleShareQuestionBank = async () => {
  const selectedBankIds = Object.entries(selectedBanks)
    .filter(([_, selected]) => selected)
    .map(([id]) => parseInt(id));

  if (selectedBankIds.length === 0) {
    message.warning('请选择要分享的题库');
    return;
  }

  // 获取选中的题库详细信息
  const selectedBankDetails = questionBanks.value
    .filter(bank => selectedBankIds.includes(bank.id))
    .map(bank => ({
      id: bank.id,
      name: bank.name,
      description: bank.description,
      questionCount: bank.questions?.length || 0
    }));

  // 发送题库分享消息
  emit('send', {
    type: 'question_bank',
    content: JSON.stringify(selectedBankDetails),
    metadata: {
      bankIds: selectedBankIds
    }
  });

  // 重置选择状态
  Object.keys(selectedBanks).forEach(key => {
    selectedBanks[key] = false;
  });
  questionBankModalVisible.value = false;
};

const handleSend = () => {
  if (!inputText.value.trim()) return;
  emit('send', {
    type: 'text',
    content: inputText.value
  });
  inputText.value = '';
};

const handleImageUpload = async (file) => {
  if (!file) return false;
  
  if (!file.type.startsWith('image/')) {
    message.error('只能上传图片文件！');
    return false;
  }

  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB！');
    return false;
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('/api/upload', formData);
    if (response.data.success) {
      emit('send', {
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
    message.error('上传图片失败');
  }

  return false;
};

const handleFileUpload = async (file) => {
  if (!file) return false;

  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    message.error('文件大小不能超过 10MB！');
    return false;
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('/api/upload', formData);
    if (response.data.success) {
      emit('send', {
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
    message.error('上传文件失败');
  }

  return false;
};
</script>

<style scoped>
.message-input {
  padding: 12px;
  border-top: 1px solid #f0f0f0;
}

.input-toolbar {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.input-area {
  margin-bottom: 8px;
}

.input-actions {
  text-align: right;
}

:deep(.ant-upload) {
  cursor: pointer;
}

:deep(.ant-space) {
  gap: 4px !important;
}

:deep(.ant-btn-text) {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.ant-btn-text:hover) {
  background: rgba(0, 0, 0, 0.06);
}

:deep(.anticon) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #666;
}

:deep(.ant-btn-text .anticon) {
  margin-right: 0;
}

.question-bank-list {
  max-height: 400px;
  overflow-y: auto;
}

.bank-info {
  margin-left: 8px;
}

.bank-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.bank-desc {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.bank-stats {
  font-size: 12px;
  color: #666;
}
</style> 