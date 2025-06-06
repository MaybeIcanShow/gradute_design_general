<template>
  <div class="login-card">
    <div class="login-header">
      <h1 class="app-title">智慧教育系统</h1>
      <h2 class="login-title">欢迎回来</h2>
      <p class="login-subtitle">请登录您的账户以继续</p>
    </div>
    
    <form @submit.prevent="onSubmit" class="login-form">
      <div class="form-item">
        <label>用户名</label>
        <input 
          v-model="username" 
          type="text" 
          placeholder="请输入用户名"
          required
          autocomplete="username"
        />
      </div>
      
      <div class="form-item">
        <label>密码</label>
        <input 
          v-model="password" 
          type="password" 
          placeholder="请输入密码"
          required
          autocomplete="current-password"
        />
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <button type="button" class="btn-secondary" @click="goToRegister">注册账号</button>
      </div>
    </form>
    
    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-alert">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { MessagePlugin } from 'tdesign-vue-next'

// 简化版登录页面
const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const router = useRouter()

// 提交表单
const onSubmit = async () => {
  if (!username.value || !password.value) {
    errorMessage.value = '请输入用户名和密码'
    return
  }
  
  loading.value = true
  errorMessage.value = ''
  
  try {
    console.log('尝试登录:', { username: username.value })
    
    // 准备登录请求数据
    const formData = new URLSearchParams()
    formData.append('username', username.value)
    formData.append('password', password.value)
    formData.append('grant_type', 'password')
    
    // 直接使用 axios 发送请求
    const apiBaseUrl = 'http://111.229.252.69:8000'
    console.log('API Base URL:', apiBaseUrl)
    
    const response = await axios.post(`${apiBaseUrl}/api/auth/login`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    
    console.log('登录成功:', response.data)
    
    // 保存认证信息到本地存储
    localStorage.setItem('token', response.data.access_token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
    
    // 显示成功消息
    MessagePlugin.success({
      content: '登录成功',
      duration: 2000,
      closeBtn: true,
    })
    
    // 跳转到聊天页面
    router.push('/chat')
  } catch (error) {
    console.error('登录错误:', error)
    
    if (error.response) {
      // 服务器响应了错误
      console.log('错误状态码:', error.response.status)
      console.log('错误数据:', error.response.data)
      
      if (error.response.status === 401) {
        errorMessage.value = '用户名或密码错误'
      } else {
        errorMessage.value = `登录失败: ${error.response.data?.detail || '请稍后重试'}`
      }
    } else if (error.request) {
      // 请求发送了但没有收到响应
      errorMessage.value = '服务器无响应，请检查网络连接'
    } else {
      // 请求设置时发生错误
      errorMessage.value = '请求配置错误: ' + error.message
    }
  } finally {
    loading.value = false
  }
}

// 跳转到注册页面
const goToRegister = () => {
  router.push('/register')
}
</script>

<style>
/* 应用到全局 */
body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  background-color: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>

<style scoped>
.login-card {
  width: 100%;
  max-width: 400px;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background-color: white;
  margin: 40px auto;
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.app-title {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #0052d9;
}

.login-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.login-subtitle {
  color: #666;
  font-size: 14px;
  margin-bottom: 0;
}

.login-form {
  margin-top: 24px;
}

.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-item input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  background-color: #fff;
}

.form-item input:focus {
  outline: none;
  border-color: #0052d9;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.btn-primary, .btn-secondary {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.btn-primary {
  background-color: #0052d9;
  color: white;
}

.btn-primary:hover {
  background-color: #0045b6;
}

.btn-secondary {
  background-color: transparent;
  color: #0052d9;
  border: 1px solid #d9d9d9;
}

.btn-secondary:hover {
  background-color: #f5f5f5;
}

.btn-primary:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-alert {
  margin-top: 16px;
  padding: 10px 12px;
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  color: #ff4d4f;
  font-size: 14px;
}
</style>
