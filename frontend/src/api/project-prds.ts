import type { ApiResponse, ProjectPrd } from '@/types'
import apiClient from './client'

export const projectPrdApi = {
  // 获取项目的所有 PRD
  list: async (projectId: number): Promise<ProjectPrd[]> => {
    const response = await apiClient.get<ApiResponse<ProjectPrd[]>>(`/projects/${projectId}/prds`)
    return response.data.data
  },

  // 创建 PRD（可选上传原型 zip）
  create: async (
    projectId: number,
    data: { name: string; prd_url?: string; file?: File }
  ): Promise<ProjectPrd> => {
    const formData = new FormData()
    formData.append('name', data.name)
    if (data.prd_url) formData.append('prd_url', data.prd_url)
    if (data.file) formData.append('file', data.file)
    const response = await apiClient.post<ApiResponse<ProjectPrd>>(
      `/projects/${projectId}/prds`,
      formData
    )
    return response.data.data
  },

  // 更新 PRD
  update: async (
    projectId: number,
    prdId: number,
    data: { name: string; prd_url?: string }
  ): Promise<ProjectPrd> => {
    const response = await apiClient.put<ApiResponse<ProjectPrd>>(
      `/projects/${projectId}/prds/${prdId}`,
      data
    )
    return response.data.data
  },

  // 删除 PRD
  delete: async (projectId: number, prdId: number): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/prds/${prdId}`)
  },

  // 上移
  moveUp: async (projectId: number, prdId: number): Promise<void> => {
    await apiClient.put(`/projects/${projectId}/prds/${prdId}/move-up`)
  },

  // 下移
  moveDown: async (projectId: number, prdId: number): Promise<void> => {
    await apiClient.put(`/projects/${projectId}/prds/${prdId}/move-down`)
  },
}
