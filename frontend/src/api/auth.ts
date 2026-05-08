import apiClient from './client'

export interface LoginResponse {
  token: string
  expires_at: string
}

export interface AdminInfo {
  id: number
  notification_email: string
  created_at: string
}

export interface LoginRequest {
  password: string
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data)
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  getMe: async (): Promise<AdminInfo> => {
    const response = await apiClient.get<AdminInfo>('/auth/me')
    return response.data
  },
}
