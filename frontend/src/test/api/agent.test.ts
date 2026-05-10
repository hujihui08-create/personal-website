import { describe, it, expect, vi, beforeEach } from 'vitest'
import { agentApi } from '@/api/agent'
import type { AgentChatRequest, AgentClearRequest } from '@/types'

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

describe('agentApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('chat', () => {
    it('should call POST /agent/chat with message and optional session_id', async () => {
      const chatRequest: AgentChatRequest = {
        message: '你好',
        session_id: 'session-123',
      }
      const mockResponse = {
        data: {
          code: 200,
          message: 'success',
          data: {
            session_id: 'session-123',
            messages: [
              { role: 'user', content: '你好', timestamp: '2026-05-10T00:00:00Z' },
              { role: 'assistant', content: '你好！有什么可以帮助你的？', timestamp: '2026-05-10T00:00:00Z' },
            ],
          },
        },
      }
      mockPost.mockResolvedValue(mockResponse)

      const result = await agentApi.chat(chatRequest)

      expect(mockPost).toHaveBeenCalledWith('/agent/chat', chatRequest)
      expect(result).toEqual(mockResponse.data)
    })

    it('should call POST /agent/chat without session_id for new conversations', async () => {
      const chatRequest: AgentChatRequest = {
        message: '你是谁？',
      }
      mockPost.mockResolvedValue({
        data: {
          code: 200,
          message: 'success',
          data: { session_id: 'new-session', messages: [] },
        },
      })

      const result = await agentApi.chat(chatRequest)

      expect(mockPost).toHaveBeenCalledWith('/agent/chat', { message: '你是谁？' })
      expect(result.data.session_id).toBe('new-session')
    })
  })

  describe('getHistory', () => {
    it('should call GET /agent/history with session_id', async () => {
      const mockResponse = {
        data: {
          code: 200,
          message: 'success',
          data: {
            session_id: 'session-123',
            messages: [
              { role: 'user' as const, content: '你好', timestamp: '2026-05-10T00:00:00Z' },
              { role: 'assistant' as const, content: '你好！', timestamp: '2026-05-10T00:00:00Z' },
            ],
          },
        },
      }
      mockGet.mockResolvedValue(mockResponse)

      const result = await agentApi.getHistory('session-123')

      expect(mockGet).toHaveBeenCalledWith('/agent/history', { params: { session_id: 'session-123' } })
      expect(result).toEqual(mockResponse.data)
      expect(result.data.messages).toHaveLength(2)
    })
  })

  describe('clearSession', () => {
    it('should call POST /agent/clear with session_id', async () => {
      const clearRequest: AgentClearRequest = { session_id: 'session-123' }
      mockPost.mockResolvedValue({
        data: { code: 200, message: 'success', data: null },
      })

      const result = await agentApi.clearSession(clearRequest)

      expect(mockPost).toHaveBeenCalledWith('/agent/clear', clearRequest)
      expect(result.data).toBeNull()
    })
  })

  describe('chatStream', () => {
    it('should return a cleanup function', () => {
      const onChunk = vi.fn()
      const onDone = vi.fn()
      const onError = vi.fn()

      const cleanup = agentApi.chatStream(
        { message: 'test', stream: true },
        onChunk,
        onDone,
        onError
      )

      expect(cleanup).toBeInstanceOf(Function)
    })
  })
})
