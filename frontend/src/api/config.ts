import type { ApiResponse, LLMConfig, EmbeddingConfig } from '@/types'
import apiClient from './client'

export const configApi = {
  getLLMConfig: async (): Promise<ApiResponse<LLMConfig>> => {
    const response = await apiClient.get<ApiResponse<LLMConfig>>('/config/llm')
    return response.data
  },

  updateLLMConfig: async (config: LLMConfig): Promise<ApiResponse<any>> => {
    const response = await apiClient.put<ApiResponse<any>>('/config/llm', config)
    return response.data
  },

  getEmbeddingConfig: async (): Promise<ApiResponse<EmbeddingConfig>> => {
    const response = await apiClient.get<ApiResponse<EmbeddingConfig>>('/config/embedding')
    return response.data
  },

  updateEmbeddingConfig: async (config: EmbeddingConfig): Promise<ApiResponse<any>> => {
    const response = await apiClient.put<ApiResponse<any>>('/config/embedding', config)
    return response.data
  },
}
