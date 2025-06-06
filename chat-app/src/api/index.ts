import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
// We'll import the auth store after it's created to avoid circular dependencies
// import { useAuthStore } from '../store/auth'

// Create API types
export interface ApiResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: any
}

// Create axios instance with base URL from environment variables
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 120 seconds for AI correction tasks
})

// Log configuration
console.log('[API Client] Configuration:', {
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 120000
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // We'll get the token directly from localStorage to avoid circular dependencies
    const token = localStorage.getItem('token')
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    console.log(`[API Client] Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`, {
      headers: config.headers,
      params: config.params,
      data: config.data ? (typeof config.data === 'string' ? 'String data (not logged)' : config.data) : null
    })
    
    return config
  },
  (error) => {
    console.error('[API Client] Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor to handle common response and errors
apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    console.log(`[API Client] Received response from ${response.config.url}:`, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data ? (typeof response.data === 'string' && response.data.length > 200 ? 'String data (truncated)' : response.data) : null
    })
    return response
  },
  (error) => {
    console.error('[API Client] Response error:', error)
    
    // Log detailed error information
    if (error.response) {
      console.error('[API Client] Error details:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      })
      
      // Handle specific error codes
      const status = error.response.status
      
      if (status === 401) {
        console.warn('[API Client] 401 Unauthorized detected - redirecting to login')
        // Unauthorized - token expired or invalid
        // Clear token from localStorage
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // Redirect to login page
        window.location.href = '/login'
      }
      
      // Return the error response for handling in components
      return Promise.reject(error.response)
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[API Client] No response received:', {
        url: error.config?.url,
        method: error.config?.method,
        request: error.request
      })
    } else {
      // Something happened in setting up the request
      console.error('[API Client] Request setup error:', error.message)
    }
    
    // Network errors or other issues
    return Promise.reject(error)
  }
)

export default apiClient
