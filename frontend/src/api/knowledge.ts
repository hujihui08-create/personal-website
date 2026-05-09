import type {
  ApiResponse,
  KnowledgeDocListResponse
} from '@/types'
import apiClient from './client'

export const knowledgeApi = {
  listDocuments: async () => {
    const response = await apiClient.get<KnowledgeDocListResponse>('/knowledge')
    return response.data.data
  },

  uploadDocument: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post<ApiResponse<null>>(
      '/knowledge',
      formData
    )
    return response.data
  },

  deleteDocument: async (id: number) => {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/knowledge/${id}`
    )
    return response.data
  },

  reindexAll: async () => {
    const response = await apiClient.post<ApiResponse<null>>(
      '/knowledge/reindex'
    )
    return response.data
  },
}
