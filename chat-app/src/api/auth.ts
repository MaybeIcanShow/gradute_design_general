import apiClient from './index'
import type { User, UserCreate, Token } from '../types/auth'

/**
 * Authentication API service
 * Implements the API methods defined in openapi.json
 */
export const authApi = {
  /**
   * Register a new user
   * POST /api/auth/register
   * @param userData User registration data
   * @returns Promise with user data
   */
  register: async (userData: UserCreate): Promise<User> => {
    const response = await apiClient.post<User>('/api/auth/register', userData)
    return response.data
  },
  
  /**
   * Login a user
   * POST /api/auth/login
   * @param username Username
   * @param password Password
   * @returns Promise with token data
   */
  login: async (username: string, password: string): Promise<Token> => {
    console.log('Attempting login with:', { username })
    
    try {
      // Using URLSearchParams for form-urlencoded data as specified in the API
      const formData = new URLSearchParams()
      formData.append('username', username)
      formData.append('password', password)
      
      // 添加额外的参数，以符合API要求
      formData.append('grant_type', 'password')
      
      console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL)
      console.log('Login request payload:', formData.toString())
      
      const response = await apiClient.post<Token>('/api/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      
      console.log('Login response:', response.data)
      return response.data
    } catch (error) {
      console.error('Login error details:', error)
      throw error
    }
  }
}
