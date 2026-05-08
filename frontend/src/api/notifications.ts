import { client } from './client'
import type { ApiResponse, PaginatedNotificationsResponse, UnreadCountResponse } from '@/types'

export const notificationsApi = {
  getNotifications: async (page = 1, pageSize = 20) => {
    const response = await client.get<ApiResponse<PaginatedNotificationsResponse>>(
      `/notifications?page=${page}&page_size=${pageSize}`
    )
    return response.data
  },

  markAsRead: async (id: number) => {
    const response = await client.put<ApiResponse<null>>(`/notifications/${id}/read`)
    return response.data
  },

  markAllAsRead: async () => {
    const response = await client.put<ApiResponse<null>>('/notifications/read-all')
    return response.data
  },

  getUnreadCount: async () => {
    const response = await client.get<ApiResponse<UnreadCountResponse>>('/notifications/unread')
    return response.data
  },
}
