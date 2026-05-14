import apiClient from './client'
import type {
  PromptTemplate,
  PromptCreateRequest,
  PromptUpdateRequest,
  TestWithPromptRequest,
  DebugChatResponse,
} from '@/types'

export const listPrompts = async (params?: {
  agent_type?: string
  page?: number
  page_size?: number
}) => {
  const response = await apiClient.get('/agent/prompts', { params })
  return response.data.data
}

export const getPrompt = async (id: number): Promise<PromptTemplate> => {
  const response = await apiClient.get(`/agent/prompts/${id}`)
  return response.data.data
}

export const createPrompt = async (data: PromptCreateRequest): Promise<PromptTemplate> => {
  const response = await apiClient.post('/agent/prompts', data)
  return response.data.data
}

export const updatePrompt = async (
  id: number,
  data: PromptUpdateRequest
): Promise<PromptTemplate> => {
  const response = await apiClient.put(`/agent/prompts/${id}`, data)
  return response.data.data
}

export const deletePrompt = async (id: number): Promise<void> => {
  await apiClient.delete(`/agent/prompts/${id}`)
}

export const setDefaultPrompt = async (id: number) => {
  const response = await apiClient.put(`/agent/prompts/${id}/default`)
  return response.data.data
}

export const testWithPrompt = async (
  id: number,
  data: TestWithPromptRequest
): Promise<DebugChatResponse> => {
  const response = await apiClient.post(`/agent/prompts/${id}/test`, data)
  return response.data.data
}
