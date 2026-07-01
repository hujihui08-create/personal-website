import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AgentChatMessage, AgentSessionMeta } from '@/types'
import { agentApi, generateVisitorId } from '@/api/agent'

interface AgentState {
  visitorId: string | null
  sessions: AgentSessionMeta[]
  activeSessionId: string | null
  messages: AgentChatMessage[]
  isLoading: boolean
  error: string | null

  initVisitor: () => void
  loadSessions: () => Promise<void>
  switchSession: (sessionId: string) => Promise<void>
  createNewSession: () => void
  deleteSession: (sessionId: string) => Promise<void>
  addMessage: (message: AgentChatMessage) => void
  updateLastMessage: (content: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setActiveSessionId: (sessionId: string | null) => void
  reset: () => void
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      visitorId: null,
      sessions: [],
      activeSessionId: null,
      messages: [],
      isLoading: false,
      error: null,

      initVisitor: () => {
        const visitorId = generateVisitorId()
        set({ visitorId })
      },

      loadSessions: async () => {
        const { visitorId } = get()
        if (!visitorId) return

        try {
          const response = await agentApi.listSessions(visitorId)
          const sessions = response.data

          set({ sessions })

          // If there are sessions and no active session, auto-select the first one
          const { activeSessionId } = get()
          if (sessions.length > 0 && !activeSessionId) {
            const firstSessionId = sessions[0].session_id
            set({ activeSessionId: firstSessionId })

            try {
              const historyResponse = await agentApi.getHistory(
                firstSessionId,
                get().visitorId || undefined
              )
              set({
                messages: historyResponse.data.messages,
                isLoading: false,
                error: null,
              })
            } catch {
              set({ messages: [], isLoading: false, error: null })
            }
          }
        } catch {
          set({ sessions: [], isLoading: false })
        }
      },

      switchSession: async (sessionId: string) => {
        set({ activeSessionId: sessionId, isLoading: true, error: null })

        try {
          const response = await agentApi.getHistory(sessionId, get().visitorId || undefined)
          set({
            messages: response.data.messages,
            isLoading: false,
            error: null,
          })
        } catch {
          set({ messages: [], isLoading: false, error: 'Failed to load session history' })
        }
      },

      createNewSession: () => {
        set({
          activeSessionId: null,
          messages: [],
          isLoading: false,
          error: null,
        })
      },

      deleteSession: async (sessionId: string) => {
        const { visitorId } = get()
        if (!visitorId) return

        try {
          await agentApi.clearSession({ session_id: sessionId, visitor_id: visitorId })

          set((state) => {
            const updatedSessions = state.sessions.filter((s) => s.session_id !== sessionId)
            const isActiveDeleted = state.activeSessionId === sessionId

            if (isActiveDeleted) {
              // Switch to first remaining session, or show welcome (empty)
              if (updatedSessions.length > 0) {
                const firstSessionId = updatedSessions[0].session_id
                return {
                  sessions: updatedSessions,
                  activeSessionId: firstSessionId,
                  messages: [],
                  isLoading: false,
                  error: null,
                }
              } else {
                return {
                  sessions: updatedSessions,
                  activeSessionId: null,
                  messages: [],
                  isLoading: false,
                  error: null,
                }
              }
            }

            return { sessions: updatedSessions }
          })

          // If the deleted session was active and a new one was selected, load its messages
          const state = get()
          if (state.activeSessionId && state.activeSessionId !== sessionId) {
            try {
              const response = await agentApi.getHistory(
                state.activeSessionId,
                state.visitorId || undefined
              )
              set({
                messages: response.data.messages,
                isLoading: false,
                error: null,
              })
            } catch {
              set({ messages: [], isLoading: false, error: null })
            }
          }
        } catch {
          set({ error: 'Failed to delete session' })
        }
      },

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

      setActiveSessionId: (sessionId) => set({ activeSessionId: sessionId }),

      reset: () =>
        set({
          visitorId: null,
          sessions: [],
          activeSessionId: null,
          messages: [],
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: 'agent-storage',
      partialize: (state) => ({
        visitorId: state.visitorId,
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
      }),
    }
  )
)
