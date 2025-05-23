import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../store/auth'

// Define routes
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('../views/ChatView.vue'),
    meta: { requiresAuth: true }
  },
  {
    // Catch-all route for 404
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard to check authentication
router.beforeEach((to, _from, next) => {
  // 直接检查localStorage中的token，而不是依赖authStore
  const hasToken = !!localStorage.getItem('token')
  const requiresAuth = to.meta.requiresAuth as boolean
  
  console.log('Navigation guard:', { path: to.path, requiresAuth, hasToken })
  
  // 如果路由需要认证且用户未登录，重定向到登录页面
  if (requiresAuth && !hasToken) {
    console.log('Redirecting to login')
    next('/login')
  } 
  // 如果用户已登录且尝试访问登录/注册页面，重定向到聊天页面
  else if ((to.path === '/login' || to.path === '/register') && hasToken) {
    console.log('Redirecting to chat')
    next('/chat')
  } 
  // 其他情况正常导航
  else {
    next()
  }
})

export default router
