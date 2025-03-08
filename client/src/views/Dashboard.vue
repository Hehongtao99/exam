<template>
  <div class="dashboard-container">
    <a-layout style="min-height: 100vh">
      <a-layout-sider>
        <div class="logo">{{ userStore.role === 'admin' ? '管理员系统' : '考试系统' }}</div>
        <a-menu theme="dark" mode="inline" v-model:selectedKeys="selectedKeys">
          <!-- 管理员菜单 -->
          <template v-if="userStore.role === 'admin'">
            <a-menu-item key="admin" @click="router.push('/dashboard/admin')">
              <template #icon>
                <span class="anticon">
                  <svg viewBox="64 64 896 896" focusable="false" data-icon="dashboard" width="1em" height="1em" fill="currentColor"><path d="M924.8 385.6a446.7 446.7 0 00-96-142.4 446.7 446.7 0 00-142.4-96C631.1 123.8 572.5 112 512 112s-119.1 11.8-174.4 35.2a446.7 446.7 0 00-142.4 96 446.7 446.7 0 00-96 142.4C75.8 440.9 64 499.5 64 560c0 132.7 58.3 257.7 159.9 343.1l1.7 1.4c5.8 4.8 13.1 7.5 20.6 7.5h531.7c7.5 0 14.8-2.7 20.6-7.5l1.7-1.4C901.7 817.7 960 692.7 960 560c0-60.5-11.9-119.1-35.2-174.4zM761.4 836H262.6A371.12 371.12 0 01140 560c0-99.4 38.7-192.8 109-263 70.3-70.3 163.7-109 263-109 99.4 0 192.8 38.7 263 109 70.3 70.3 109 163.7 109 263 0 105.6-44.5 205.5-122.6 276z"></path></svg>
                </span>
              </template>
              <span>控制台</span>
            </a-menu-item>
            <a-menu-item key="admin-users" @click="router.push('/dashboard/admin/users')">
              <template #icon>
                <span class="anticon">
                  <svg viewBox="64 64 896 896" focusable="false" data-icon="team" width="1em" height="1em" fill="currentColor"><path d="M824.2 699.9a301.55 301.55 0 00-86.4-60.4C783.1 602.8 812 546.8 812 484c0-110.8-92.4-201.7-203.2-200-109.1 1.7-197 90.6-197 200 0 62.8 29 118.8 74.2 155.5a300.95 300.95 0 00-86.4 60.4C345 754.6 314 826.8 312 903.8a8 8 0 008 8.2h56c4.3 0 7.9-3.4 8-7.7 1.9-58 25.4-112.3 66.7-153.5A226.62 226.62 0 01612 684c60.9 0 118.2 23.7 161.3 66.8C814.5 792 838 846.3 840 904.3c.1 4.3 3.7 7.7 8 7.7h56a8 8 0 008-8.2c-2-77-33-149.2-87.8-203.9zM612 612c-34.2 0-66.4-13.3-90.5-37.5a126.86 126.86 0 01-37.5-91.8c.3-32.8 13.4-64.5 36.3-88 24-24.6 56.1-38.3 90.4-38.7 33.9-.3 66.8 12.9 91 36.6 24.8 24.3 38.4 56.8 38.4 91.4 0 34.2-13.3 66.3-37.5 90.5A127.3 127.3 0 01612 612zM361.5 510.4c-.9-8.7-1.4-17.5-1.4-26.4 0-15.9 1.5-31.4 4.3-46.5.7-3.6-1.2-7.3-4.5-8.8-13.6-6.1-26.1-14.5-36.9-25.1a127.54 127.54 0 01-38.7-95.4c.9-32.1 13.8-62.6 36.3-85.6 24.7-25.3 57.9-39.1 93.2-38.7 31.9.3 62.7 12.6 86 34.4 7.9 7.4 14.7 15.6 20.4 24.4 2 3.1 5.9 4.4 9.3 3.2 17.6-6.1 36.2-10.4 55.3-12.4 5.6-.6 8.8-6.6 6.3-11.6-32.5-64.3-98.9-108.7-175.7-109.9-110.9-1.7-203.3 89.2-203.3 199.9 0 62.8 28.9 118.8 74.2 155.5-31.8 14.7-61.1 35-86.5 60.4-54.8 54.7-85.8 126.9-87.8 204a8 8 0 008 8.2h56.1c4.3 0 7.9-3.4 8-7.7 1.9-58 25.4-112.3 66.7-153.5 29.4-29.4 65.4-49.8 104.7-59.7 3.9-1 6.5-4.7 6-8.7z"></path></svg>
                </span>
              </template>
              <span>用户管理</span>
            </a-menu-item>
          </template>

          <!-- 普通用户菜单 -->
          <template v-else>
            <a-menu-item key="dashboard" @click="router.push('/dashboard')">
              <template #icon>
                <span class="anticon">
                  <svg viewBox="64 64 896 896" focusable="false" data-icon="dashboard" width="1em" height="1em" fill="currentColor"><path d="M924.8 385.6a446.7 446.7 0 00-96-142.4 446.7 446.7 0 00-142.4-96C631.1 123.8 572.5 112 512 112s-119.1 11.8-174.4 35.2a446.7 446.7 0 00-142.4 96 446.7 446.7 0 00-96 142.4C75.8 440.9 64 499.5 64 560c0 132.7 58.3 257.7 159.9 343.1l1.7 1.4c5.8 4.8 13.1 7.5 20.6 7.5h531.7c7.5 0 14.8-2.7 20.6-7.5l1.7-1.4C901.7 817.7 960 692.7 960 560c0-60.5-11.9-119.1-35.2-174.4zM761.4 836H262.6A371.12 371.12 0 01140 560c0-99.4 38.7-192.8 109-263 70.3-70.3 163.7-109 263-109 99.4 0 192.8 38.7 263 109 70.3 70.3 109 163.7 109 263 0 105.6-44.5 205.5-122.6 276z"></path></svg>
                </span>
              </template>
              <span>控制台</span>
            </a-menu-item>
            <a-menu-item key="question-banks" @click="router.push('/dashboard/question-banks')">
              <template #icon>
                <span class="anticon">
                  <svg viewBox="64 64 896 896" focusable="false" data-icon="book" width="1em" height="1em" fill="currentColor"><path d="M832 64H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-260 72h96v209.9L621.5 312 572 347.4V136zm220 752H232V136h280v296.9c0 3.3 1 6.6 3 9.3a15.9 15.9 0 0022.3 3.7l83.8-59.9 81.4 59.4c2.7 2 6 3.1 9.4 3.1 8.8 0 16-7.2 16-16V136h64v752z"></path></svg>
                </span>
              </template>
              <span>题库管理</span>
            </a-menu-item>
            <a-menu-item key="mistake-books" @click="router.push('/dashboard/mistake-books')">
              <template #icon>
                <span class="anticon">
                  <svg viewBox="64 64 896 896" focusable="false" data-icon="exception" width="1em" height="1em" fill="currentColor"><path d="M688 312v-48c0-4.4-3.6-8-8-8H296c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h384c4.4 0 8-3.6 8-8zm-392 88c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h184c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H296zm376 116c-119.3 0-216 96.7-216 216s96.7 216 216 216 216-96.7 216-216-96.7-216-216-216zm107.5 323.5C750.8 868.2 712.6 884 672 884s-78.8-15.8-107.5-44.5C535.8 810.8 520 772.6 520 732s15.8-78.8 44.5-107.5C593.2 595.8 631.4 580 672 580s78.8 15.8 107.5 44.5C808.2 653.2 824 691.4 824 732s-15.8 78.8-44.5 107.5zM440 852H208V148h560v344c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V108c0-17.7-14.3-32-32-32H168c-17.7 0-32 14.3-32 32v784c0 17.7 14.3 32 32 32h272c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8z"></path></svg>
                </span>
              </template>
              <span>错题本</span>
            </a-menu-item>
            <a-menu-item key="chat" @click="router.push('/dashboard/chat')">
              <template #icon>
                <span class="anticon">
                  <svg viewBox="64 64 896 896" focusable="false" data-icon="message" width="1em" height="1em" fill="currentColor"><path d="M464 512a48 48 0 1096 0 48 48 0 10-96 0zm200 0a48 48 0 1096 0 48 48 0 10-96 0zm-400 0a48 48 0 1096 0 48 48 0 10-96 0zm661.2-173.6c-22.6-53.7-55-101.9-96.3-143.3a444.35 444.35 0 00-143.3-96.3C630.6 75.7 572.2 64 512 64h-2c-60.6.3-119.3 12.3-174.5 35.9a445.35 445.35 0 00-142 96.5c-40.9 41.3-73 89.3-95.2 142.8-23 55.4-34.6 114.3-34.3 174.9A449.4 449.4 0 00112 714v152a46 46 0 0046 46h152.1A449.4 449.4 0 00510 960h2.1c59.9 0 118-11.6 172.7-34.3a444.48 444.48 0 00142.8-95.2c41.3-40.9 73.8-88.7 96.5-142 23.6-55.2 35.6-113.9 35.9-174.5.3-60.9-11.5-120-34.8-175.6zm-151.1 438C704 845.8 611 884 512 884h-1.7c-60.3-.3-120.2-15.3-173.1-43.5l-8.4-4.5H188V695.2l-4.5-8.4C155.3 633.9 140.3 574 140 513.7c-.4-99.7 37.7-193.3 107.6-263.8 69.8-70.5 163.1-109.5 262.8-109.9h1.7c50 0 98.5 9.7 144.2 28.9 44.6 18.7 84.6 45.6 119 80 34.3 34.3 61.3 74.4 80 119 19.4 46.2 29.1 95.2 28.9 145.8-.6 99.6-39.7 192.9-110.1 262.7z"></path></svg>
                </span>
              </template>
              <span>聊天</span>
            </a-menu-item>
            <a-menu-item key="group-chat" @click="router.push('/dashboard/group-chat')">
              <template #icon>
                <span class="anticon">
                  <svg viewBox="64 64 896 896" focusable="false" data-icon="team" width="1em" height="1em" fill="currentColor">
                    <path d="M824.2 699.9a301.55 301.55 0 00-86.4-60.4C783.1 602.8 812 546.8 812 484c0-110.8-92.4-201.7-203.2-200-109.1 1.7-197 90.6-197 200 0 62.8 29 118.8 74.2 155.5a300.95 300.95 0 00-86.4 60.4C345 754.6 314 826.8 312 903.8a8 8 0 008 8.2h56c4.3 0 7.9-3.4 8-7.7 1.9-58 25.4-112.3 66.7-153.5A226.62 226.62 0 01612 684c60.9 0 118.2 23.7 161.3 66.8C814.5 792 838 846.3 840 904.3c.1 4.3 3.7 7.7 8 7.7h56a8 8 0 008-8.2c-2-77-33-149.2-87.8-203.9zM612 612c-34.2 0-66.4-13.3-90.5-37.5a126.86 126.86 0 01-37.5-91.8c.3-32.8 13.4-64.5 36.3-88 24-24.6 56.1-38.3 90.4-38.7 33.9-.3 66.8 12.9 91 36.6 24.8 24.3 38.4 56.8 38.4 91.4 0 34.2-13.3 66.3-37.5 90.5A127.3 127.3 0 01612 612zM361.5 510.4c-.9-8.7-1.4-17.5-1.4-26.4 0-15.9 1.5-31.4 4.3-46.5.7-3.6-1.2-7.3-4.5-8.8-13.6-6.1-26.1-14.5-36.9-25.1a127.54 127.54 0 01-38.7-95.4c.9-32.1 13.8-62.6 36.3-85.6 24.7-25.3 57.9-39.1 93.2-38.7 31.9.3 62.7 12.6 86 34.4 7.9 7.4 14.7 15.6 20.4 24.4 2 3.1 5.9 4.4 9.3 3.2 17.6-6.1 36.2-10.4 55.3-12.4 5.6-.6 8.8-6.6 6.3-11.6-32.5-64.3-98.9-108.7-175.7-109.9-110.9-1.7-203.3 89.2-203.3 199.9 0 62.8 28.9 118.8 74.2 155.5-31.8 14.7-61.1 35-86.5 60.4-54.8 54.7-85.8 126.9-87.8 204a8 8 0 008 8.2h56.1c4.3 0 7.9-3.4 8-7.7 1.9-58 25.4-112.3 66.7-153.5 29.4-29.4 65.4-49.8 104.7-59.7 3.9-1 6.5-4.7 6-8.7z"></path>
                  </svg>
                </span>
              </template>
              <span>群聊</span>
            </a-menu-item>
          </template>

          <!-- 公共菜单项 -->
          <a-menu-item key="profile" @click="router.push('/dashboard/profile')">
            <template #icon>
              <span class="anticon">
                <svg viewBox="64 64 896 896" focusable="false" data-icon="user" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M858.5 763.6a374 374 0 00-80.6-119.5 375.63 375.63 0 00-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-.4.2-.8.3-1.2.5-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 00-80.6 119.5A371.7 371.7 0 00136 901.8a8 8 0 008 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.4 3.6 7.8 8 7.8h60a8 8 0 008-8.2c-1-47.8-10.9-94.3-28.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z"></path></svg>
              </span>
            </template>
            <span>个人信息</span>
          </a-menu-item>
        </a-menu>
      </a-layout-sider>
      <a-layout>
        <a-layout-header>
          <div class="header-right">
            <a-space>
              <span class="welcome">欢迎回来，{{ userStore.nickname || userStore.username }}</span>
              <a-button type="link" @click="handleLogout">退出登录</a-button>
            </a-space>
          </div>
        </a-layout-header>
        <a-layout-content>
          <router-view></router-view>
        </a-layout-content>
        <a-layout-footer>
          {{ userStore.role === 'admin' ? '管理员系统' : '考试系统' }} ©2024
        </a-layout-footer>
      </a-layout>
    </a-layout>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useUserStore } from '../store/user'

const router = useRouter()
const userStore = useUserStore()
const selectedKeys = ref([userStore.role === 'admin' ? 'admin' : 'dashboard'])

// 监听路由变化，更新选中的菜单项
watch(
  () => router.currentRoute.value.path,
  (path) => {
    if (path.includes('/admin/users')) {
      selectedKeys.value = ['admin-users']
    } else if (path.includes('/admin')) {
      selectedKeys.value = ['admin']
    } else if (path.includes('/question-banks')) {
      selectedKeys.value = ['question-banks']
    } else if (path.includes('/exam')) {
      selectedKeys.value = ['question-banks']
    } else if (path.includes('/mistake-books')) {
      selectedKeys.value = ['mistake-books']
    } else if (path.includes('/chat')) {
      selectedKeys.value = ['chat']
    } else if (path.includes('/group-chat')) {
      selectedKeys.value = ['group-chat']
    } else if (path.includes('/profile')) {
      selectedKeys.value = ['profile']
    } else {
      selectedKeys.value = [userStore.role === 'admin' ? 'admin' : 'dashboard']
    }
  },
  { immediate: true }
)

const handleLogout = () => {
  userStore.clearUser()
  router.push('/login')
  message.success('已退出登录')
}
</script>

<style scoped>
.dashboard-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  background: #f0f2f5;
}

.logo {
  height: 32px;
  margin: 16px 12px;
  color: white;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  line-height: 32px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

:deep(.ant-layout-sider) {
  overflow: auto;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  box-shadow: 2px 0 8px 0 rgba(29, 35, 41, 0.05);
  width: 100px !important;
}

:deep(.ant-layout-header) {
  background: #fff;
  padding: 0;
  position: fixed;
  top: 0;
  right: 0;
  width: calc(100% - 200px);
  z-index: 2;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  height: 64px;
  line-height: 64px;
}

.header-right {
  float: right;
  margin-right: 24px;
}

.welcome {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
}

:deep(.ant-layout-content) {
  margin: 88px 24px 24px;
  overflow: initial;
  flex: 1;
  min-height: 280px;
}

:deep(.ant-layout) {
  margin-left: 100px;
}

:deep(.ant-layout-footer) {
  text-align: center;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
  background: transparent;
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