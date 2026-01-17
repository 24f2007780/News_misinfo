import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// API base URL configuration
const isDevelopment = process.env.NODE_ENV === 'development'
const API_BASE_URL = isDevelopment
  ? 'http://localhost:8000/api'  // Local development
  : '/api'  // Production (relative URL for Vercel)

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/auth
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
