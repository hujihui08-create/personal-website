import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authApi } from '@/api/auth'

const { mockPost, mockGet, mockPut, mockDelete } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockGet: vi.fn(),
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

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should call POST /auth/login with credentials and return token data', async () => {
      const loginData = { password: 'admin123' }
      const mockResponse = {
        data: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
          expires_at: '2026-12-31T23:59:59Z',
        },
      }
      mockPost.mockResolvedValue(mockResponse)

      const result = await authApi.login(loginData)

      expect(mockPost).toHaveBeenCalledTimes(1)
      expect(mockPost).toHaveBeenCalledWith('/auth/login', loginData)
      expect(result).toEqual(mockResponse.data)
    })

    it('should propagate errors from the API', async () => {
      const error = new Error('Network Error')
      mockPost.mockRejectedValue(error)

      await expect(authApi.login({ password: 'wrong' })).rejects.toThrow('Network Error')
    })
  })

  describe('logout', () => {
    it('should call POST /auth/logout', async () => {
      mockPost.mockResolvedValue({ data: undefined })

      await authApi.logout()

      expect(mockPost).toHaveBeenCalledTimes(1)
      expect(mockPost).toHaveBeenCalledWith('/auth/logout')
    })

    it('should resolve even when the API returns no data', async () => {
      mockPost.mockResolvedValue({})

      await expect(authApi.logout()).resolves.toBeUndefined()
    })
  })

  describe('getMe', () => {
    it('should call GET /auth/me and return admin info', async () => {
      const mockAdminInfo = {
        id: 1,
        notification_email: 'admin@example.com',
        created_at: '2026-01-01T00:00:00Z',
      }
      mockGet.mockResolvedValue({ data: mockAdminInfo })

      const result = await authApi.getMe()

      expect(mockGet).toHaveBeenCalledTimes(1)
      expect(mockGet).toHaveBeenCalledWith('/auth/me')
      expect(result).toEqual(mockAdminInfo)
    })
  })
})
