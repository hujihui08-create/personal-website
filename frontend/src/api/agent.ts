import type {
  ApiResponse,
  AgentChatRequest,
  AgentChatSession,
  AgentChatStreamChunk,
  AgentClearRequest,
  AgentSessionMeta,
} from '@/types'
import apiClient from './client'
import { useAuthStore } from '@/stores/auth'

export const agentApi = {
  chat: async (request: AgentChatRequest) => {
    const response = await apiClient.post<ApiResponse<AgentChatSession>>('/agent/chat', request)
    return response.data
  },

  chatStream: (
    request: AgentChatRequest,
    onChunk: (chunk: AgentChatStreamChunk) => void,
    onDone: (sessionId: string) => void,
    onError: (error: Error) => void
  ) => {
    const url = `/api/agent/chat`
    const token = useAuthStore.getState().token

    const eventSource = new EventSourcePolyfill(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
    })

    eventSource.addEventListener('message', (event) => {
      try {
        const chunk: AgentChatStreamChunk = JSON.parse(event.data)
        onChunk(chunk)

        if (chunk.type === 'done' && chunk.session_id) {
          onDone(chunk.session_id)
          eventSource.close()
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error)
      }
    })

    eventSource.addEventListener('error', () => {
      eventSource.close()
      onError(new Error('SSE connection failed'))
    })

    return () => {
      eventSource.close()
    }
  },

  getHistory: async (sessionId: string) => {
    const response = await apiClient.get<ApiResponse<AgentChatSession>>('/agent/history', {
      params: { session_id: sessionId },
    })
    return response.data
  },

  clearSession: async (request: AgentClearRequest) => {
    const response = await apiClient.post<ApiResponse<null>>('/agent/clear', request)
    return response.data
  },

  listSessions: async (visitorId: string) => {
    const response = await apiClient.get<ApiResponse<AgentSessionMeta[]>>('/agent/sessions', {
      params: { visitor_id: visitorId },
    })
    return response.data
  },
}

export function generateVisitorId(): string {
  const stored = localStorage.getItem('visitor_id')
  if (stored) return stored
  const id = crypto.randomUUID()
  localStorage.setItem('visitor_id', id)
  return id
}

class EventSourcePolyfill {
  private url: string
  private options: {
    method: string
    headers: Record<string, string>
    body: string
  }
  private eventListeners: Record<string, Array<(event: any) => void>> = {}
  private controller?: AbortController
  private closed = false

  constructor(url: string, options: any) {
    this.url = url
    this.options = options
    this.init()
  }

  private async init() {
    try {
      console.log('[EventSourcePolyfill] 连接到:', this.url)
      this.controller = new AbortController()
      const response = await fetch(this.url, {
        method: this.options.method,
        headers: this.options.headers,
        body: this.options.body,
        signal: this.controller.signal,
      })

      console.log('[EventSourcePolyfill] 响应状态:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[EventSourcePolyfill] 请求失败:', errorText)
        throw new Error(`请求失败: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取响应流')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      let done = false
      while (!done) {
        const result = await reader.read()
        done = result.done
        if (done) break

        buffer += decoder.decode(result.value, { stream: true })

        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            this.dispatchEvent('message', { data })
          }
        }
      }

      if (!this.closed) {
        this.dispatchEvent('done')
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      console.error('[EventSourcePolyfill] 发生错误:', error)
      this.dispatchEvent('error', error)
    }
  }

  addEventListener(type: string, listener: (event: any) => void) {
    if (!this.eventListeners[type]) {
      this.eventListeners[type] = []
    }
    this.eventListeners[type].push(listener)
  }

  removeEventListener(type: string, listener: (event: any) => void) {
    if (!this.eventListeners[type]) return
    const index = this.eventListeners[type].indexOf(listener)
    if (index !== -1) {
      this.eventListeners[type].splice(index, 1)
    }
  }

  dispatchEvent(type: string, event?: any) {
    if (!this.eventListeners[type]) return
    for (const listener of this.eventListeners[type]) {
      listener(event)
    }
  }

  close() {
    this.closed = true
    this.controller?.abort()
  }
}
