import type {
  ApiResponse,
  AgentChatRequest,
  AgentChatSession,
  AgentChatStreamChunk,
  AgentClearRequest
} from '@/types'
import apiClient from './client'

export const agentApi = {
  chat: async (request: AgentChatRequest) => {
    const response = await apiClient.post<ApiResponse<AgentChatSession>>(
      '/agent/chat',
      request
    )
    return response.data
  },

  chatStream: (
    request: AgentChatRequest,
    onChunk: (chunk: AgentChatStreamChunk) => void,
    onDone: (sessionId: string) => void,
    onError: (error: Error) => void
  ) => {
    const url = `/api/agent/chat`
    const token = localStorage.getItem('auth_token')

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
    const response = await apiClient.get<ApiResponse<AgentChatSession>>(
      '/agent/history',
      { params: { session_id: sessionId } }
    )
    return response.data
  },

  clearSession: async (request: AgentClearRequest) => {
    const response = await apiClient.post<ApiResponse<null>>(
      '/agent/clear',
      request
    )
    return response.data
  },
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

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            this.dispatchEvent('message', { data })
          }
        }
      }

    } catch (error) {
      // 不要将 AbortError 作为错误处理，因为这是正常关闭
      if (error instanceof Error && error.name !== 'AbortError' && !(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('[EventSourcePolyfill] 发生错误:', error)
        this.dispatchEvent('error', error)
      }
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

  dispatchEvent(type: string, event: any) {
    if (!this.eventListeners[type]) return
    for (const listener of this.eventListeners[type]) {
      listener(event)
    }
  }

  close() {
    this.controller?.abort()
  }
}
