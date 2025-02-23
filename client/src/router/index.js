import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import QuestionBank from '../views/QuestionBank.vue'
import Questions from '../views/Questions.vue'
import Exam from '../views/Exam.vue'
import ExamResult from '../views/ExamResult.vue'
import MistakeBooks from '../views/MistakeBooks.vue'
import MistakeExam from '../views/MistakeExam.vue'
import UserHome from '../views/Dashboard/Home.vue'
import AdminHome from '../views/Admin/Home.vue'
import Profile from '../views/Profile.vue'

const routes = [
  {
    path: '/',
    redirect: to => {
      const userStore = useUserStore()
      if (!userStore.id) {
        return '/login'
      }
      return userStore.role === 'admin' ? '/admin' : '/dashboard'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  // 管理员路由
  {
    path: '/admin',
    component: () => import('../views/Admin/AdminPanel.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: AdminHome
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: () => import('../views/Admin/UserManagement.vue')
      },
      {
        path: 'users/:id',
        name: 'UserDetail',
        component: () => import('../views/Admin/UserDetail.vue')
      },
      {
        path: 'question-banks',
        name: 'AdminQuestionBanks',
        component: () => import('../views/Admin/QuestionBanks.vue')
      },
      {
        path: 'question-banks/:id/questions',
        name: 'QuestionDetail',
        component: () => import('../views/Admin/QuestionDetail.vue')
      },
      {
        path: 'profile',
        name: 'AdminProfile',
        component: Profile
      }
    ]
  },
  // 用户路由
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true, requiresUser: true },
    children: [
      {
        path: '',
        name: 'UserDashboard',
        component: UserHome
      },
      {
        path: 'question-banks',
        name: 'QuestionBank',
        component: QuestionBank
      },
      {
        path: 'question-banks/:id/questions',
        name: 'Questions',
        component: Questions
      },
      {
        path: 'exams',
        name: 'ExamManagement',
        component: () => import('../views/ExamManagement.vue')
      },
      {
        path: 'exam/:bankId',
        name: 'Exam',
        component: () => import('../views/Exam.vue')
      },
      {
        path: 'exam-result/:examId',
        name: 'ExamResult',
        component: () => import('../views/ExamResult.vue')
      },
      {
        path: 'mistake-books',
        name: 'MistakeBooks',
        component: MistakeBooks
      },
      {
        path: 'mistake-exam/:bookId',
        name: 'MistakeExam',
        component: MistakeExam
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: Profile
      },
      {
        path: 'chat',
        name: 'Chat',
        component: () => import('../views/Chat.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  console.log('路由守卫 - 当前用户信息：', {
    id: userStore.id,
    role: userStore.role,
    to: to.path,
    from: from.path
  });
  
  if (to.matched.some(record => record.meta.requiresAuth)) {
    console.log('路由需要认证');
    if (!userStore.id) {
      console.log('用户未登录，重定向到登录页');
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // 检查是否需要管理员权限
    if (to.matched.some(record => record.meta.requiresAdmin)) {
      console.log('路由需要管理员权限');
      if (userStore.role !== 'admin') {
        console.log('用户不是管理员，重定向到用户面板');
        next({ path: '/dashboard' })
        return
      }
      console.log('用户是管理员，允许访问');
    }
    
    // 检查是否是普通用户路由
    if (to.matched.some(record => record.meta.requiresUser)) {
      console.log('路由需要普通用户权限');
      if (userStore.role === 'admin') {
        console.log('用户是管理员，重定向到管理员面板');
        next({ path: '/admin' })
        return
      }
      console.log('用户是普通用户，允许访问');
    }
    
    next()
  } else {
    // 处理登录页面的特殊情况
    if (to.path === '/login' && userStore.id) {
      const redirectPath = userStore.role === 'admin' ? '/admin' : '/dashboard';
      console.log('用户已登录，从登录页重定向到：', redirectPath);
      next(redirectPath)
      return
    }
    next()
  }
})

export default router
