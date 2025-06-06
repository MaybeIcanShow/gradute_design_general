<template>
  <div class="register-card">
    <div class="register-header">
      <h1 class="app-title">智慧教育系统</h1>
      <h2 class="register-title">创建账户</h2>
      <p class="register-subtitle">请填写以下信息完成注册</p>
    </div>
    
    <form @submit.prevent="onSubmit" class="register-form">
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
        <label>邮箱</label>
        <input 
          v-model="email" 
          type="email" 
          placeholder="请输入邮箱"
          required
          autocomplete="email"
        />
      </div>
      
      <div class="form-item">
        <label>密码</label>
        <input 
          v-model="password" 
          type="password" 
          placeholder="请输入密码"
          required
          autocomplete="new-password"
        />
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
        <button type="button" class="btn-secondary" @click="goToLogin">返回登录</button>
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

// 简化版注册页面
const username = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const router = useRouter()

// 提交表单
const onSubmit = async () => {
  if (!username.value || !email.value || !password.value) {
    errorMessage.value = '请填写所有必填字段'
    return
  }
  
  // 简单的客户端验证
  if (username.value.length < 3 || username.value.length > 50) {
    errorMessage.value = '用户名长度应为3-50个字符'
    return
  }
  
  if (password.value.length < 6) {
    errorMessage.value = '密码长度至少6个字符'
    return
  }
  
  loading.value = true
  errorMessage.value = ''
  
  try {
    console.log('尝试注册:', { username: username.value, email: email.value })
    
    // 准备注册请求数据
    const userData = {
      username: username.value,
      email: email.value,
      password: password.value
    }
    
    // 直接使用 axios 发送请求
    const apiBaseUrl = 'http://111.229.252.69:8000'
    console.log('API Base URL:', apiBaseUrl)
    
    const response = await axios.post(`${apiBaseUrl}/api/auth/register`, userData, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log('注册成功:', response.data)
    
    // 显示成功消息
    MessagePlugin.success({
      content: '注册成功，请登录',
      duration: 2000,
      closeBtn: true,
    })
    
    // 跳转到登录页面
    router.push('/login')
  } catch (error) {
    console.error('注册错误:', error)
    
    if (error.response) {
      // 服务器响应了错误
      console.log('错误状态码:', error.response.status)
      console.log('错误数据:', error.response.data)
      
      if (error.response.status === 409) {
        errorMessage.value = '用户名或邮箱已存在'
      } else if (error.response.status === 422) {
        if (error.response.data?.detail) {
          if (Array.isArray(error.response.data.detail)) {
            // 处理数组形式的验证错误
            errorMessage.value = error.response.data.detail.map(err => err.msg).join(', ')
          } else {
            // 处理字符串形式的错误
            errorMessage.value = error.response.data.detail
          }
        } else {
          errorMessage.value = '表单数据验证失败'
        }
      } else {
        errorMessage.value = `注册失败: ${error.response.data?.detail || '请稍后重试'}`
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

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-card {
  width: 100%;
  max-width: 400px;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background-color: white;
  margin: 40px auto;
}

.register-header {
  text-align: center;
  margin-bottom: 24px;
}

.app-title {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #0052d9;
}

.register-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.register-subtitle {
  color: #666;
  font-size: 14px;
  margin-bottom: 0;
}

.register-form {
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
