import type { ApiResponse, Prototype } from '@/types'
import apiClient from './client'

export const prototypeApi = {
  // 获取原型列表（公开，不需要认证）
  list: async (): Promise<Prototype[]> => {
    const response = await apiClient.get<ApiResponse<Prototype[]>>('/prototypes')
    return response.data.data
  },

  // 上传原型（管理端，需要认证）
  upload: async (file: File, name?: string): Promise<Prototype> => {
    const formData = new FormData()
    formData.append('file', file)
    if (name) {
      formData.append('name', name)
    }
    const response = await apiClient.post<ApiResponse<Prototype>>('/prototypes', formData)
    return response.data.data
  },

  // 删除原型（管理端，需要认证）
  delete: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/prototypes/${id}`)
  },
}
