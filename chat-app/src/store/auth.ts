import { defineStore } from 'pinia'
import type { User, Token } from '../types/auth'

interface AuthState {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => {
    // 检查token是否存在且有效
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    const isLoggedIn = !!token
    
    return {
      token,
      user,
      isLoggedIn
    }
  },
  
  getters: {
    getToken: (state) => state.token,
    getUser: (state) => state.user,
    isAuthenticated: (state) => state.isLoggedIn
  },
  
  actions: {
    /**
     * Login action - stores token and user data
     * @param token Access token
     * @param user User data
     */
    login(token: string, user: User): void {
      this.token = token
      this.user = user
      this.isLoggedIn = true
      
      // Persist to localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },
    
    /**
     * Logout action - clears token and user data
     */
    logout(): void {
      this.token = null
      this.user = null
      this.isLoggedIn = false
      
      // Remove from localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    
    /**
     * Check if user is authenticated
     * @returns boolean indicating if user is logged in
     */
    checkAuth(): boolean {
      return this.isLoggedIn
    },
    
    /**
     * Set auth data from token response
     * @param tokenData Token response from API
     */
    setAuthFromTokenResponse(tokenData: Token): void {
      this.login(tokenData.access_token, tokenData.user)
    }
  }
})
