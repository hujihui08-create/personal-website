import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProfile, updateProfile, uploadAvatar } from '@/api/profile'

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

describe('profile API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getProfile', () => {
    it('should call GET /profile and return profile data wrapped in ApiResponse', async () => {
      const mockProfile = {
        name: '张三',
        title: '全栈工程师',
        bio: '热爱编程',
        avatarUrl: 'https://example.com/avatar.png',
        githubUrl: 'https://github.com/test',
        linkedinUrl: 'https://linkedin.com/in/test',
        email: 'test@example.com',
        skills: ['React', 'Go'],
      }
      const mockApiResponse = {
        data: {
          code: 200,
          message: 'success',
          data: mockProfile,
        },
      }
      mockGet.mockResolvedValue(mockApiResponse)

      const result = await getProfile()

      expect(mockGet).toHaveBeenCalledTimes(1)
      expect(mockGet).toHaveBeenCalledWith('/profile')
      expect(result).toEqual(mockApiResponse.data)
    })

    it('should propagate errors', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'))

      await expect(getProfile()).rejects.toThrow('Network Error')
    })
  })

  describe('updateProfile', () => {
    it('should call PUT /profile with partial data and return updated profile', async () => {
      const updateData = { name: '李四', title: '高级工程师' }
      const mockResponse = {
        data: {
          code: 200,
          message: 'success',
          data: {
            ...updateData,
            bio: '热爱编程',
            avatarUrl: '',
            githubUrl: '',
            linkedinUrl: '',
            email: 'test@example.com',
            skills: [],
          },
        },
      }
      mockPut.mockResolvedValue(mockResponse)

      const result = await updateProfile(updateData)

      expect(mockPut).toHaveBeenCalledTimes(1)
      expect(mockPut).toHaveBeenCalledWith('/profile', updateData)
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('uploadAvatar', () => {
    it('should call POST /profile/avatar with FormData', async () => {
      const file = new File(['avatar-content'], 'avatar.png', { type: 'image/png' })
      const mockResponse = {
        data: {
          code: 200,
          message: 'success',
          data: { avatar_url: 'https://example.com/new-avatar.png' },
        },
      }
      mockPost.mockResolvedValue(mockResponse)

      const result = await uploadAvatar(file)

      expect(mockPost).toHaveBeenCalledTimes(1)
      expect(mockPost).toHaveBeenCalledWith('/profile/avatar', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      expect(result).toEqual(mockResponse.data)
    })
  })
})
