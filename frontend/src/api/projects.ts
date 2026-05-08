import apiClient from './client'
import type { Project } from '@/types'

export const projectApi = {
  getAll: async (): Promise<Project[]> => {
    const response = await apiClient.get('/projects')
    return response.data.data
  },

  getById: async (id: string): Promise<Project> => {
    const response = await apiClient.get(`/projects/${id}`)
    return response.data.data
  },

  create: async (data: Partial<Project>): Promise<Project> => {
    const response = await apiClient.post('/projects', data)
    return response.data.data
  },

  update: async (id: string, data: Partial<Project>): Promise<Project> => {
    const response = await apiClient.put(`/projects/${id}`, data)
    return response.data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`)
  },
}
