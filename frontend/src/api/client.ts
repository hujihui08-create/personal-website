import type { AxiosInstance } from 'axios'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 如果不是 FormData，才设置 Content-Type 为 application/json
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json'
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      if (!url.includes('/auth/login')) {
        useAuthStore.getState().logout()
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
export { apiClient as client }
