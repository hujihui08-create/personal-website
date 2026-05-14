import apiClient from './client'
import type { DebugChatRequest, DebugChatResponse } from '@/types'

export const debugChat = async (data: DebugChatRequest): Promise<DebugChatResponse> => {
  const response = await apiClient.post('/agent/debug', data)
  return response.data.data
}

export const getDebugHistory = async (page = 1, pageSize = 20) => {
  const response = await apiClient.get('/agent/debug/history', {
    params: { page, page_size: pageSize },
  })
  return response.data.data
}

export const deleteDebugHistory = async (id?: number) => {
  const response = await apiClient.delete('/agent/debug/history', {
    params: id ? { id } : undefined,
  })
  return response.data.data
}

export const testRetrieval = async (query: string, topK = 3) => {
  const response = await apiClient.get('/agent/debug/retrieval', {
    params: { query, top_k: topK },
  })
  return response.data.data
}
