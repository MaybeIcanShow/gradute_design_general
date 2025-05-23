import { createApp } from 'vue'
import { createPinia } from 'pinia'
import TDesign from 'tdesign-vue-next'
import TDesignChat from '@tdesign-vue-next/chat'
import router from './router'
// 代码高亮样式（任选一种主题）
import 'highlight.js/styles/github.css'

// MathJax 使用 CDN 加载，不需要导入样式


// Import TDesign styles
import 'tdesign-vue-next/es/style/index.css'

// Import global styles
import './style.css'
import App from './App.vue'

// 创建应用实例
const app = createApp(App)

// 创建并使用Pinia存储
const pinia = createPinia()
app.use(pinia)

// 检查token是否有效
const token = localStorage.getItem('token')
if (!token) {
  // 如果没有token，确保清除本地存储
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

// 使用其他插件
app.use(router)
app.use(TDesign)
app.use(TDesignChat)

// 挂载应用
app.mount('#app')
