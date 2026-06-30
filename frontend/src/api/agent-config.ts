import type { ApiResponse, AgentIntent, AgentTool, AgentConfig, AgentConfigVersion } from '@/types'
import apiClient from './client'

export const agentConfigApi = {
  // Intents
  listIntents: async () => {
    const response = await apiClient.get<ApiResponse<AgentIntent[]>>('/admin/agent/intents')
    return response.data
  },

  createIntent: async (data: Partial<AgentIntent>) => {
    const response = await apiClient.post<ApiResponse<AgentIntent>>('/admin/agent/intents', data)
    return response.data
  },

  updateIntent: async (id: number, data: Partial<AgentIntent>) => {
    const response = await apiClient.put<ApiResponse<AgentIntent>>(
      `/admin/agent/intents/${id}`,
      data
    )
    return response.data
  },

  deleteIntent: async (id: number) => {
    const response = await apiClient.delete<ApiResponse<null>>(`/admin/agent/intents/${id}`)
    return response.data
  },

  updateIntentSort: async (intents: { id: number; sort_order: number }[]) => {
    const response = await apiClient.put<ApiResponse<null>>('/admin/agent/intents/sort', {
      intents,
    })
    return response.data
  },

  // Tools
  listTools: async () => {
    const response = await apiClient.get<ApiResponse<AgentTool[]>>('/admin/agent/tools')
    return response.data
  },

  updateToolActive: async (name: string, isActive: boolean) => {
    const response = await apiClient.put<ApiResponse<AgentTool>>(`/admin/agent/tools/${name}`, {
      is_active: isActive,
    })
    return response.data
  },

  // Config
  getCurrentConfig: async () => {
    const response = await apiClient.get<ApiResponse<AgentConfig>>('/admin/agent/configs/current')
    return response.data
  },

  saveDraft: async (config: Record<string, unknown>) => {
    const response = await apiClient.post<ApiResponse<AgentConfig>>('/admin/agent/configs', {
      config,
    })
    return response.data
  },

  publishConfig: async () => {
    const response = await apiClient.post<ApiResponse<AgentConfig>>('/admin/agent/configs/publish')
    return response.data
  },

  listVersions: async () => {
    const response = await apiClient.get<ApiResponse<AgentConfigVersion[]>>(
      '/admin/agent/configs/versions'
    )
    return response.data
  },

  rollback: async (versionId: number) => {
    const response = await apiClient.post<ApiResponse<AgentConfig>>(
      `/admin/agent/configs/rollback/${versionId}`
    )
    return response.data
  },
}
