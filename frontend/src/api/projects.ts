import apiClient from './client'
import type { Project, PaginatedProjectsResponse } from '@/types'

export interface ListProjectsParams {
  type?: 'enterprise' | 'personal'
  page?: number
  pageSize?: number
}

export const projectApi = {
  list: async (params?: ListProjectsParams): Promise<PaginatedProjectsResponse> => {
    const response = await apiClient.get('/projects', { params })
    return response.data.data
  },

  listFeatured: async (limit?: number): Promise<Project[]> => {
    const response = await apiClient.get('/projects/featured', { params: { limit } })
    return response.data.data
  },

  getById: async (id: number): Promise<Project> => {
    const response = await apiClient.get(`/projects/${id}`)
    return response.data.data
  },

  create: async (data: Partial<Project>): Promise<Project> => {
    const response = await apiClient.post('/projects', data)
    return response.data.data
  },

  update: async (id: number, data: Partial<Project>): Promise<Project> => {
    const response = await apiClient.put(`/projects/${id}`, data)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/projects/${id}`)
  },

  reorder: async (ids: number[]): Promise<void> => {
    await apiClient.put('/projects/reorder', { ids })
  },

  toggleFeatured: async (id: number): Promise<Project> => {
    const response = await apiClient.put(`/projects/${id}/featured`)
    return response.data.data
  },

  uploadCoverImage: async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post('/projects/upload-cover', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data.url
  },

  uploadProjectImage: async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post('/projects/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data.url
  },
}
