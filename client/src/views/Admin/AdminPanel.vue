<template>
  <div class="admin-panel">
    <a-layout>
      <a-layout-sider theme="dark" width="240" class="admin-sider">
        <div class="logo">管理员面板</div>
        <a-menu
          theme="dark"
          v-model:selectedKeys="selectedKeys"
          mode="inline"
        >
          <a-menu-item key="dashboard" @click="router.push('/admin')">
            <template #icon>
              <dashboard-outlined />
            </template>
            <span>控制台</span>
          </a-menu-item>
          <a-menu-item key="users" @click="router.push('/admin/users')">
            <template #icon>
              <team-outlined />
            </template>
            <span>用户管理</span>
          </a-menu-item>
          <a-menu-item key="question-banks" @click="router.push('/admin/question-banks')">
            <template #icon>
              <book-outlined />
            </template>
            <span>题库管理</span>
          </a-menu-item>
        </a-menu>
      </a-layout-sider>
      <a-layout class="site-layout">
        <a-layout-header class="admin-header">
          <div class="header-right">
            <a-space>
              <span>欢迎回来，管理员</span>
              <a-button type="link" @click="handleLogout">退出登录</a-button>
            </a-space>
          </div>
        </a-layout-header>
        <a-layout-content class="admin-content">
          <router-view></router-view>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { useUserStore } from '../../store/user';
import {
  DashboardOutlined,
  TeamOutlined,
  BookOutlined,
  SolutionOutlined,
  BarChartOutlined
} from '@ant-design/icons-vue';

const router = useRouter();
const userStore = useUserStore();
const selectedKeys = ref(['dashboard']);

const handleLogout = () => {
  userStore.clearUser();
  router.push('/login');
  message.success('已退出登录');
};
</script>

<style scoped>
.admin-panel {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
}

.admin-panel :deep(.ant-layout) {
  width: 100%;
}

.logo {
  height: 32px;
  margin: 16px;
  color: white;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  line-height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.admin-sider {
  overflow: auto;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 10;
}

.site-layout {
  min-height: 100vh;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
  width: calc(100vw - 240px);
  overflow: hidden;
}

.admin-header {
  background: #fff;
  padding: 0 24px;
  position: fixed;
  top: 0;
  right: 0;
  left: 240px;
  z-index: 9;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 64px;
}

.admin-content {
  flex: 1;
  margin-top: 64px;
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 64px);
  overflow-x: hidden;
  overflow-y: auto;
}

.header-right {
  margin-left: auto;
}

:deep(.ant-menu-item) {
  margin-top: 4px;
}

:deep(.ant-menu-item.ant-menu-item-selected) {
  background-color: #1890ff;
}

:deep(.ant-layout-sider-children) {
  display: flex;
  flex-direction: column;
}

:deep(.ant-menu) {
  flex: 1;
  padding: 8px 0;
}
</style>
