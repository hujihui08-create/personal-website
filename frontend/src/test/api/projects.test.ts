import { describe, it, expect, vi, beforeEach } from 'vitest'
import { projectApi } from '@/api/projects'

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

describe('projectApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockProject = {
    id: 1,
    name: '个人网站',
    type: 'personal' as const,
    startDate: '2025-01-01',
    endDate: '2025-06-01',
    summary: '一个个人项目集网站',
    description: '使用 React 和 Go 构建的个人网站',
    coverImage: 'https://example.com/cover.png',
    images: ['https://example.com/img1.png'],
    githubUrl: 'https://github.com/test/portfolio',
    demoUrl: 'https://example.com',
    tags: ['React', 'Go'],
    isFeatured: false,
    sortOrder: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-06-01T00:00:00Z',
  }

  describe('list', () => {
    it('should call GET /projects with default params and return paginated response', async () => {
      const mockApiResponse = {
        data: {
          data: {
            items: [mockProject],
            total: 1,
            page: 1,
            pageSize: 10,
          },
        },
      }
      mockGet.mockResolvedValue(mockApiResponse)

      const result = await projectApi.list()

      expect(mockGet).toHaveBeenCalledTimes(1)
      expect(mockGet).toHaveBeenCalledWith('/projects', { params: undefined })
      expect(result).toEqual(mockApiResponse.data.data)
      expect(result.items).toHaveLength(1)
    })

    it('should pass filter params when provided', async () => {
      mockGet.mockResolvedValue({ data: { data: { items: [], total: 0, page: 1, pageSize: 10 } } })

      await projectApi.list({ type: 'enterprise', page: 2, pageSize: 5 })

      expect(mockGet).toHaveBeenCalledWith('/projects', {
        params: { type: 'enterprise', page: 2, pageSize: 5 },
      })
    })
  })

  describe('listFeatured', () => {
    it('should call GET /projects/featured with limit', async () => {
      mockGet.mockResolvedValue({ data: { data: [mockProject] } })

      const result = await projectApi.listFeatured(3)

      expect(mockGet).toHaveBeenCalledWith('/projects/featured', { params: { limit: 3 } })
      expect(result).toEqual([mockProject])
    })
  })

  describe('getById', () => {
    it('should call GET /projects/:id and return a project', async () => {
      mockGet.mockResolvedValue({ data: { data: mockProject } })

      const result = await projectApi.getById(1)

      expect(mockGet).toHaveBeenCalledWith('/projects/1')
      expect(result).toEqual(mockProject)
    })
  })

  describe('create', () => {
    it('should call POST /projects with data and return created project', async () => {
      const newProject = {
        name: '新项目',
        type: 'personal' as const,
        summary: '',
        description: '',
        coverImage: '',
        images: [],
        githubUrl: '',
        demoUrl: '',
        tags: [],
        sortOrder: 0,
      }
      mockPost.mockResolvedValue({ data: { data: { ...newProject, id: 2 } } })

      const result = await projectApi.create(newProject)

      expect(mockPost).toHaveBeenCalledWith('/projects', newProject)
      expect(result.id).toBe(2)
    })
  })

  describe('update', () => {
    it('should call PUT /projects/:id with partial data', async () => {
      const updateData = { name: '更新后的项目' }
      mockPut.mockResolvedValue({ data: { data: { ...mockProject, ...updateData } } })

      const result = await projectApi.update(1, updateData)

      expect(mockPut).toHaveBeenCalledWith('/projects/1', updateData)
      expect(result.name).toBe('更新后的项目')
    })
  })

  describe('delete', () => {
    it('should call DELETE /projects/:id', async () => {
      mockDelete.mockResolvedValue({})

      await projectApi.delete(1)

      expect(mockDelete).toHaveBeenCalledWith('/projects/1')
    })
  })

  describe('reorder', () => {
    it('should call PUT /projects/reorder with ids array', async () => {
      mockPut.mockResolvedValue({})

      await projectApi.reorder([3, 1, 2])

      expect(mockPut).toHaveBeenCalledWith('/projects/reorder', { ids: [3, 1, 2] })
    })
  })

  describe('toggleFeatured', () => {
    it('should call PUT /projects/:id/featured and return updated project', async () => {
      const toggledProject = { ...mockProject, isFeatured: true }
      mockPut.mockResolvedValue({ data: { data: toggledProject } })

      const result = await projectApi.toggleFeatured(1)

      expect(mockPut).toHaveBeenCalledWith('/projects/1/featured')
      expect(result.isFeatured).toBe(true)
    })
  })

  describe('uploadCoverImage', () => {
    it('should call POST /projects/upload-cover with FormData', async () => {
      const file = new File(['content'], 'cover.jpg', { type: 'image/jpeg' })
      mockPost.mockResolvedValue({
        data: { data: { url: 'https://example.com/uploaded-cover.jpg' } },
      })

      const result = await projectApi.uploadCoverImage(file)

      expect(mockPost).toHaveBeenCalledWith('/projects/upload-cover', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      expect(result).toBe('https://example.com/uploaded-cover.jpg')
    })
  })

  describe('uploadProjectImage', () => {
    it('should call POST /projects/upload-image with FormData', async () => {
      const file = new File(['content'], 'screenshot.png', { type: 'image/png' })
      mockPost.mockResolvedValue({ data: { data: { url: 'https://example.com/image.png' } } })

      const result = await projectApi.uploadProjectImage(file)

      expect(mockPost).toHaveBeenCalledWith('/projects/upload-image', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      expect(result).toBe('https://example.com/image.png')
    })
  })
})
