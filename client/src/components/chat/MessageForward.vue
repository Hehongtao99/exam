<template>
  <div class="message-forward">
    <a-modal
      v-model:open="visible"
      title="转发消息"
      @ok="handleForward"
      :confirm-loading="forwarding"
    >
      <!-- 好友列表 -->
      <a-list :data-source="friends" class="forward-list">
        <template #renderItem="{ item }">
          <a-list-item>
            <a-checkbox v-model:checked="selectedFriends[item.id]">
              <div class="forward-item">
                <a-avatar :src="item.avatar">
                  {{ item.nickname?.substring(0, 1) || item.username.substring(0, 1) }}
                </a-avatar>
                <span class="forward-name">{{ item.nickname || item.username }}</span>
              </div>
            </a-checkbox>
          </a-list-item>
        </template>
      </a-list>

      <!-- 转发备注 -->
      <div class="forward-comment">
        <a-input
          v-model:value="comment"
          placeholder="添加转发说明(可选)"
          allow-clear
        />
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { message } from 'ant-design-vue';
import axios from 'axios';

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
});

const visible = ref(false);
const forwarding = ref(false);
const comment = ref('');
const friends = ref([]);
const selectedFriends = reactive({});

// 显示转发对话框
const showForward = async () => {
  visible.value = true;
  await fetchFriends();
};

// 获取好友列表
const fetchFriends = async () => {
  try {
    const response = await axios.get('/api/friends/list');
    if (response.data.success) {
      friends.value = response.data.data;
    }
  } catch (error) {
    message.error('获取好友列表失败');
  }
};

// 处理转发
const handleForward = async () => {
  const selectedFriendIds = Object.entries(selectedFriends)
    .filter(([_, selected]) => selected)
    .map(([id]) => parseInt(id));

  if (selectedFriendIds.length === 0) {
    message.warning('请选择转发对象');
    return;
  }

  forwarding.value = true;
  try {
    await axios.post('/api/messages/forward', {
      messageId: props.message.id,
      friendIds: selectedFriendIds,
      comment: comment.value
    });

    message.success('转发成功');
    visible.value = false;
    resetForm();
  } catch (error) {
    message.error('转发失败');
  } finally {
    forwarding.value = false;
  }
};

// 重置表单
const resetForm = () => {
  comment.value = '';
  Object.keys(selectedFriends).forEach(key => {
    selectedFriends[key] = false;
  });
};

defineExpose({
  showForward
});
</script>

<style scoped>
.forward-list {
  height: 300px;
  overflow-y: auto;
}

.forward-item {
  display: flex;
  align-items: center;
  margin-left: 8px;
}

.forward-name {
  margin-left: 12px;
}

.forward-comment {
  margin-top: 16px;
}
</style> 