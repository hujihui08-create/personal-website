import { describe, it, expect, vi, beforeEach } from 'vitest'
import { bookingApi } from '@/api/booking'
import type {
  CreateBookingRequest,
  UpdateBookingStatusRequest,
  UpdateScheduleSettingsRequest,
} from '@/api/booking'

const { mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
}))

vi.mock('@/api/client', () => ({
  default: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
  },
}))

describe('bookingApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSlots', () => {
    it('should call GET /bookings/slots with date param', async () => {
      const mockResponse = {
        data: {
          code: 200,
          message: 'success',
          data: {
            date: '2026-05-15',
            weekday: 'Friday',
            is_available: true,
            slots: [
              { time: '09:00', available: true },
              { time: '10:00', available: false, reason: '已预约' },
            ],
          },
        },
      }
      mockGet.mockResolvedValue(mockResponse)

      const result = await bookingApi.getSlots('2026-05-15')

      expect(mockGet).toHaveBeenCalledWith('/bookings/slots', { params: { date: '2026-05-15' } })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('createBooking', () => {
    it('should call POST /bookings with booking data', async () => {
      const bookingData: CreateBookingRequest = {
        company_name: '测试公司',
        company_location: '北京',
        booking_date: '2026-05-15',
        booking_time: '09:00',
        contact_name: '张三',
        contact_email: 'test@test.com',
        contact_phone: '13800138000',
        notes: '期待交流',
      }
      const mockResponse = {
        data: {
          code: 200,
          message: 'success',
          data: {
            id: 1,
            ...bookingData,
            status: 'pending',
            created_at: '2026-05-10T00:00:00Z',
            updated_at: '2026-05-10T00:00:00Z',
          },
        },
      }
      mockPost.mockResolvedValue(mockResponse)

      const result = await bookingApi.createBooking(bookingData)

      expect(mockPost).toHaveBeenCalledWith('/bookings', bookingData)
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('getBookings', () => {
    it('should call GET /bookings with query params', async () => {
      mockGet.mockResolvedValue({
        data: {
          code: 200,
          message: 'success',
          data: { items: [], total: 0, page: 1, pageSize: 10 },
        },
      })

      await bookingApi.getBookings({ page: 1, page_size: 10, status: 'pending' })

      expect(mockGet).toHaveBeenCalledWith('/bookings', {
        params: { page: 1, page_size: 10, status: 'pending' },
      })
    })
  })

  describe('getBooking', () => {
    it('should call GET /bookings/:id', async () => {
      mockGet.mockResolvedValue({
        data: {
          code: 200,
          message: 'success',
          data: { id: 1, company_name: '测试' },
        },
      })

      const result = await bookingApi.getBooking(1)

      expect(mockGet).toHaveBeenCalledWith('/bookings/1')
      expect(result.data).toHaveProperty('id', 1)
    })
  })

  describe('updateBookingStatus', () => {
    it('should call PUT /bookings/:id/status', async () => {
      const statusData: UpdateBookingStatusRequest = { status: 'confirmed' }
      mockPut.mockResolvedValue({
        data: {
          code: 200,
          message: 'success',
          data: { id: 1, status: 'confirmed' },
        },
      })

      const result = await bookingApi.updateBookingStatus(1, statusData)

      expect(mockPut).toHaveBeenCalledWith('/bookings/1/status', statusData)
      expect(result.data.status).toBe('confirmed')
    })
  })

  describe('getScheduleSettings', () => {
    it('should call GET /schedule', async () => {
      mockGet.mockResolvedValue({
        data: {
          code: 200,
          message: 'success',
          data: [{ id: 1, weekday: 1, start_time: '09:00', end_time: '17:00', is_active: true }],
        },
      })

      const result = await bookingApi.getScheduleSettings()

      expect(mockGet).toHaveBeenCalledWith('/schedule')
      expect(result.data).toHaveLength(1)
    })
  })

  describe('updateScheduleSettings', () => {
    it('should call PUT /schedule with settings', async () => {
      const settingsData: UpdateScheduleSettingsRequest = {
        slots: [{ weekday: 1, start_time: '09:00', end_time: '17:00', is_active: true }],
      }
      mockPut.mockResolvedValue({ data: { code: 200, message: 'success', data: undefined } })

      await bookingApi.updateScheduleSettings(settingsData)

      expect(mockPut).toHaveBeenCalledWith('/schedule', settingsData)
    })
  })

  describe('lookupBooking', () => {
    it('should call GET /bookings/lookup with id and phone params', async () => {
      const mockResponse = {
        data: {
          code: 200,
          message: 'success',
          data: {
            id: 1,
            company_name: '测试公司',
            company_location: '北京',
            booking_date: '2026-05-15',
            booking_time: '09:00',
            contact_name: '张三',
            contact_email: 'test@test.com',
            contact_phone: '13800138000',
            status: 'pending',
            created_at: '2026-05-10T00:00:00Z',
            updated_at: '2026-05-10T00:00:00Z',
          },
        },
      }
      mockGet.mockResolvedValue(mockResponse)

      const result = await bookingApi.lookupBooking({ phone: '13800138000', id: 1 })

      expect(mockGet).toHaveBeenCalledWith('/bookings/lookup', {
        params: { phone: '13800138000', id: 1 },
      })
      expect(result).toEqual(mockResponse.data)
      expect(result.data).toHaveProperty('id', 1)
      expect(result.data).toHaveProperty('status', 'pending')
    })

    it('should call GET /bookings/lookup with contact_name and phone params', async () => {
      const mockResponse = {
        data: {
          code: 200,
          message: 'success',
          data: {
            id: 1,
            company_name: '测试公司',
            contact_name: '张三',
            contact_phone: '13800138000',
            status: 'pending',
          },
        },
      }
      mockGet.mockResolvedValue(mockResponse)

      const result = await bookingApi.lookupBooking({ phone: '13800138000', contact_name: '张三' })

      expect(mockGet).toHaveBeenCalledWith('/bookings/lookup', {
        params: { phone: '13800138000', contact_name: '张三' },
      })
      expect(result).toEqual(mockResponse.data)
    })

    it('should call GET /bookings/lookup with company_name and phone params', async () => {
      const mockResponse = {
        data: {
          code: 200,
          message: 'success',
          data: {
            id: 1,
            company_name: '测试公司',
            contact_phone: '13800138000',
            status: 'pending',
          },
        },
      }
      mockGet.mockResolvedValue(mockResponse)

      const result = await bookingApi.lookupBooking({
        phone: '13800138000',
        company_name: '测试公司',
      })

      expect(mockGet).toHaveBeenCalledWith('/bookings/lookup', {
        params: { phone: '13800138000', company_name: '测试公司' },
      })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('cancelBookingByUser', () => {
    it('should call PUT /bookings/:id/cancel with phone param', async () => {
      const mockResponse = {
        data: {
          code: 200,
          message: '取消成功',
          data: {
            id: 1,
            company_name: '测试公司',
            status: 'cancelled',
            contact_phone: '13800138000',
          },
        },
      }
      mockPut.mockResolvedValue(mockResponse)

      const result = await bookingApi.cancelBookingByUser(1, '13800138000')

      expect(mockPut).toHaveBeenCalledWith('/bookings/1/cancel', null, {
        params: { phone: '13800138000' },
      })
      expect(result.data.status).toBe('cancelled')
    })

    it('should call PUT /bookings/:id/cancel with cancel_reason', async () => {
      const mockResponse = {
        data: {
          code: 200,
          message: '取消成功',
          data: {
            id: 1,
            company_name: '测试公司',
            status: 'cancelled',
            cancel_reason: '时间冲突',
            contact_phone: '13800138000',
          },
        },
      }
      mockPut.mockResolvedValue(mockResponse)

      const result = await bookingApi.cancelBookingByUser(1, '13800138000', '时间冲突')

      expect(mockPut).toHaveBeenCalledWith(
        '/bookings/1/cancel',
        { cancel_reason: '时间冲突' },
        { params: { phone: '13800138000' } }
      )
      expect(result.data.status).toBe('cancelled')
      expect(result.data.cancel_reason).toBe('时间冲突')
    })
  })

  describe('updateBookingByUser', () => {
    it('should call PUT /bookings/:id with phone param and update data', async () => {
      const updateData = {
        company_name: '新公司名',
        booking_date: '2026-06-01',
        booking_time: '10:00',
      }
      const mockResponse = {
        data: {
          code: 200,
          message: '修改成功',
          data: {
            id: 1,
            company_name: '新公司名',
            company_location: '北京',
            booking_date: '2026-06-01',
            booking_time: '10:00',
            contact_name: '张三',
            contact_email: 'test@test.com',
            contact_phone: '13800138000',
            status: 'pending',
          },
        },
      }
      mockPut.mockResolvedValue(mockResponse)

      const result = await bookingApi.updateBookingByUser(1, '13800138000', updateData)

      expect(mockPut).toHaveBeenCalledWith('/bookings/1', updateData, {
        params: { phone: '13800138000' },
      })
      expect(result.data.company_name).toBe('新公司名')
      expect(result.data.booking_date).toBe('2026-06-01')
    })
  })
})
