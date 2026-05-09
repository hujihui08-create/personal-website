import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AgentChatMessage } from '@/types'

interface AgentState {
  sessionId: string | null
  messages: AgentChatMessage[]
  isLoading: boolean
  error: string | null
  setSessionId: (sessionId: string | null) => void
  addMessage: (message: AgentChatMessage) => void
  updateLastMessage: (content: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearSession: () => void
  reset: () => void
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set) => ({
      sessionId: null,
      messages: [],
      isLoading: false,
      error: null,

      setSessionId: (sessionId) => set({ sessionId }),

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      updateLastMessage: (content) =>
        set((state) => {
          if (state.messages.length === 0) return state
          const lastMessage = state.messages[state.messages.length - 1]
          if (lastMessage.role !== 'assistant') return state

          const updatedMessages = [...state.messages]
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            content: lastMessage.content + content,
          }
          return { messages: updatedMessages }
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearSession: () =>
        set({
          sessionId: null,
          messages: [],
          isLoading: false,
          error: null,
        }),

      reset: () =>
        set({
          sessionId: null,
          messages: [],
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: 'agent-storage',
      partialize: (state) => ({
        sessionId: state.sessionId,
        messages: state.messages,
      }),
    }
  )
)
