import apiClient from './client'
import type { ApiResponse, PaginatedResponse, Booking, ScheduleSetting, SlotsResponse } from '@/types'

export interface CreateBookingRequest {
  company_name: string
  company_location: string
  booking_date: string
  booking_time: string
  contact_name: string
  contact_email: string
  contact_phone: string
  notes?: string
}

export interface UpdateBookingStatusRequest {
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled'
  reject_reason?: string
}

export interface UpdateScheduleSettingsRequest {
  slots: Omit<ScheduleSetting, 'id' | 'created_at' | 'updated_at'>[]
}

export const bookingApi = {
  async getSlots(date: string): Promise<ApiResponse<SlotsResponse>> {
    const response = await apiClient.get('/bookings/slots', { params: { date } })
    return response.data
  },

  async createBooking(data: CreateBookingRequest): Promise<ApiResponse<Booking>> {
    const response = await apiClient.post('/bookings', data)
    return response.data
  },

  async getBookings(params?: {
    page?: number
    page_size?: number
    status?: string
    search?: string
  }): Promise<ApiResponse<PaginatedResponse<Booking>>> {
    const response = await apiClient.get('/bookings', { params })
    return response.data
  },

  async getBooking(id: number): Promise<ApiResponse<Booking>> {
    const response = await apiClient.get(`/bookings/${id}`)
    return response.data
  },

  async updateBookingStatus(
    id: number,
    data: UpdateBookingStatusRequest
  ): Promise<ApiResponse<Booking>> {
    const response = await apiClient.put(`/bookings/${id}/status`, data)
    return response.data
  },

  async getScheduleSettings(): Promise<ApiResponse<ScheduleSetting[]>> {
    const response = await apiClient.get('/schedule')
    return response.data
  },

  async updateScheduleSettings(
    data: UpdateScheduleSettingsRequest
  ): Promise<ApiResponse<void>> {
    const response = await apiClient.put('/schedule', data)
    return response.data
  },
}
