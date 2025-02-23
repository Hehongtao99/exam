<template>
  <div class="profile-container">
    <a-row :gutter="24">
      <a-col :span="8">
        <a-card>
          <template #cover>
            <div class="avatar-wrapper">
              <a-upload
                name="avatar"
                :show-upload-list="false"
                :before-upload="beforeUpload"
                @change="handleAvatarChange"
                action="http://localhost:3000/api/user/avatar"
                :headers="{
                  'X-User-Id': userInfo.id
                }"
              >
                <div class="avatar-container">
                  <img v-if="userInfo.avatar" :src="userInfo.avatar" alt="avatar" />
                  <div v-else class="avatar-placeholder">
                    <span class="anticon">
                      <svg viewBox="64 64 896 896" focusable="false" data-icon="user" width="1em" height="1em" fill="currentColor"><path d="M858.5 763.6a374 374 0 00-80.6-119.5 375.63 375.63 0 00-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-.4.2-.8.3-1.2.5-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 00-80.6 119.5A371.7 371.7 0 00136 901.8a8 8 0 008 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.4 3.6 7.8 8 7.8h60a8 8 0 008-8.2c-1-47.8-10.9-94.3-28.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z"></path></svg>
                    </span>
                  </div>
                  <div class="avatar-mask">
                    <span class="anticon">
                      <svg viewBox="64 64 896 896" focusable="false" data-icon="camera" width="1em" height="1em" fill="currentColor"><path d="M864 248H728l-32.4-90.8a32.07 32.07 0 00-30.2-21.2H358.6c-13.5 0-25.6 8.5-30.1 21.2L296 248H160c-44.2 0-80 35.8-80 80v456c0 44.2 35.8 80 80 80h704c44.2 0 80-35.8 80-80V328c0-44.2-35.8-80-80-80zm8 536c0 4.4-3.6 8-8 8H160c-4.4 0-8-3.6-8-8V328c0-4.4 3.6-8 8-8h186.7l17.1-47.8 22.9-64.2h250.5l22.9 64.2 17.1 47.8H864c4.4 0 8 3.6 8 8v456zM512 384c-88.4 0-160 71.6-160 160s71.6 160 160 160 160-71.6 160-160-71.6-160-160-160zm0 256c-53 0-96-43-96-96s43-96 96-96 96 43 96 96-43 96-96 96z"></path></svg>
                    </span>
                    <span>更换头像</span>
                  </div>
                </div>
              </a-upload>
            </div>
          </template>
          <template #title>
            <div class="user-name">{{ userInfo.username }}</div>
          </template>
          <div class="user-signature">{{ userInfo.signature || '这个人很懒，什么都没留下' }}</div>
        </a-card>
      </a-col>

      <a-col :span="16">
        <a-card>
          <a-tabs v-model:activeKey="activeTab">
            <a-tab-pane key="basic" tab="基本信息">
              <a-form
                :model="userForm"
                :label-col="{ span: 4 }"
                :wrapper-col="{ span: 16 }"
              >
                <a-form-item label="用户名">
                  <a-input v-model:value="userForm.username" disabled />
                </a-form-item>
                <a-form-item label="昵称">
                  <a-input v-model:value="userForm.nickname" placeholder="请输入昵称" />
                </a-form-item>
                <a-form-item label="个性签名">
                  <a-textarea
                    v-model:value="userForm.signature"
                    :rows="4"
                    placeholder="请输入个性签名"
                  />
                </a-form-item>
                <a-form-item :wrapper-col="{ offset: 4 }">
                  <a-button type="primary" @click="handleUpdateInfo">保存修改</a-button>
                </a-form-item>
              </a-form>
            </a-tab-pane>

            <a-tab-pane key="security" tab="安全设置">
              <a-form
                :model="passwordForm"
                :label-col="{ span: 4 }"
                :wrapper-col="{ span: 16 }"
              >
                <a-form-item label="原密码" required>
                  <a-input-password
                    v-model:value="passwordForm.oldPassword"
                    placeholder="请输入原密码"
                  />
                </a-form-item>
                <a-form-item label="新密码" required>
                  <a-input-password
                    v-model:value="passwordForm.newPassword"
                    placeholder="请输入新密码"
                  />
                </a-form-item>
                <a-form-item label="确认密码" required>
                  <a-input-password
                    v-model:value="passwordForm.confirmPassword"
                    placeholder="请再次输入新密码"
                  />
                </a-form-item>
                <a-form-item :wrapper-col="{ offset: 4 }">
                  <a-button type="primary" @click="handleUpdatePassword">修改密码</a-button>
                </a-form-item>
              </a-form>
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import axios from 'axios';
import { useUserStore } from '../store/user';

const router = useRouter();
const userStore = useUserStore();
const activeTab = ref('basic');

const userInfo = ref({
  id: '',
  username: '',
  nickname: '',
  avatar: '',
  signature: ''
});

const userForm = reactive({
  username: '',
  nickname: '',
  signature: ''
});

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const response = await axios.get('/api/user/profile');
    if (response.data.success) {
      userInfo.value = response.data.data;
      Object.assign(userForm, {
        username: response.data.data.username,
        nickname: response.data.data.nickname,
        signature: response.data.data.signature
      });
    }
  } catch (error) {
    message.error('获取用户信息失败');
  }
};

// 更新用户信息
const handleUpdateInfo = async () => {
  try {
    const response = await axios.put('/api/user/profile', userForm);
    if (response.data.success) {
      message.success('更新成功');
      // 更新本地状态
      userInfo.value = response.data.data;
      // 同步更新到 Pinia store
      userStore.setUser(response.data.data);
    }
  } catch (error) {
    message.error('更新失败');
  }
};

// 更新密码
const handleUpdatePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    message.error('两次输入的密码不一致');
    return;
  }

  try {
    const response = await axios.put('/api/user/password', {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    });

    if (response.data.success) {
      message.success('密码修改成功，请重新登录');
      // 清除密码表单
      passwordForm.oldPassword = '';
      passwordForm.newPassword = '';
      passwordForm.confirmPassword = '';
      // 跳转到登录页
      router.push('/login');
    }
  } catch (error) {
    message.error(error.response?.data?.message || '密码修改失败');
  }
};

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

// 处理头像变化
const handleAvatarChange = async (info) => {
  if (info.file.status === 'uploading') {
    return;
  }
  if (info.file.status === 'done') {
    const response = info.file.response;
    if (response.success) {
      // 更新本地状态
      userInfo.value = response.data;
      // 同步更新到 Pinia store
      userStore.setUser(response.data);
      message.success('头像更新成功');
    } else {
      message.error('头像上传失败');
    }
  } else if (info.file.status === 'error') {
    message.error('头像上传失败');
  }
};

onMounted(() => {
  fetchUserInfo();
});
</script>

<style scoped>
.profile-container {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 200px);
}

.avatar-wrapper {
  padding: 24px;
  text-align: center;
}

.avatar-container {
  position: relative;
  width: 128px;
  height: 128px;
  margin: 0 auto;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
}

.avatar-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-placeholder .anticon {
  font-size: 48px;
  color: #d9d9d9;
}

.avatar-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-container:hover .avatar-mask {
  opacity: 1;
}

.avatar-mask .anticon {
  font-size: 24px;
  margin-bottom: 8px;
}

.user-name {
  font-size: 20px;
  font-weight: 500;
  text-align: center;
  margin: 16px 0 8px;
}

.user-signature {
  text-align: center;
  color: #666;
  font-size: 14px;
}

:deep(.ant-upload) {
  width: 100%;
}
</style> 