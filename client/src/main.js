import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import axios from 'axios'
import { createPinia } from 'pinia'
import { useUserStore } from './store/user'
import { wsClient } from './utils/websocket'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// 创建 store 实例
const userStore = useUserStore()

// 配置axios默认值
axios.defaults.baseURL = 'http://localhost:3000'

// 添加请求拦截器
axios.interceptors.request.use(config => {
  if (userStore.id) {
    config.headers['X-User-Id'] = userStore.id
  }
  return config
})

// 添加响应拦截器
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      userStore.clearUser()
      wsClient.close()
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

app.use(router)
app.use(Antd)

// 在用户登录后初始化WebSocket连接
if (userStore.id) {
  wsClient.connect(userStore.id).catch(console.error)
}

app.mount('#app')
