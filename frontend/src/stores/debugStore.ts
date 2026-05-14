import { create } from 'zustand'
import type { DebugInfo, DebugHistoryItem } from '@/types'
import { debugChat, getDebugHistory, deleteDebugHistory } from '@/api/debug'

interface DebugMessage {
  role: 'user' | 'assistant'
  content: string
}

interface DebugState {
  agentType: string
  messages: DebugMessage[]
  debugInfo: DebugInfo | null
  showRetrieval: boolean
  showPrompt: boolean
  isLoading: boolean
  history: DebugHistoryItem[]
  historyTotal: number

  setAgentType: (agentType: string) => void
  sendMessage: (message: string, customPromptId?: number) => Promise<void>
  toggleRetrieval: () => void
  togglePrompt: () => void
  loadHistory: (page?: number) => Promise<void>
  clearHistory: () => Promise<void>
  deleteHistoryItem: (id: number) => Promise<void>
  clearMessages: () => void
}

export const useDebugStore = create<DebugState>((set, get) => ({
  agentType: '',
  messages: [],
  debugInfo: null,
  showRetrieval: true,
  showPrompt: false,
  isLoading: false,
  history: [],
  historyTotal: 0,

  setAgentType: (agentType) => set({ agentType }),

  sendMessage: async (message, customPromptId) => {
    const { agentType, showRetrieval, showPrompt } = get()
    set({ isLoading: true, messages: [...get().messages, { role: 'user', content: message }] })

    try {
      const result = await debugChat({
        message,
        agent_type: agentType || undefined,
        show_retrieval: showRetrieval,
        show_prompt: showPrompt,
        custom_prompt_id: customPromptId,
      })

      set((state) => ({
        debugInfo: result.debug_info,
        messages: [...state.messages, { role: 'assistant', content: result.answer }],
        isLoading: false,
      }))
    } catch {
      set({ isLoading: false })
    }
  },

  toggleRetrieval: () => set((s) => ({ showRetrieval: !s.showRetrieval })),
  togglePrompt: () => set((s) => ({ showPrompt: !s.showPrompt })),

  loadHistory: async (page = 1) => {
    try {
      const result = await getDebugHistory(page, 20)
      set({
        history: result.items || result.data || [],
        historyTotal: result.total || result.pagination?.total || 0,
      })
    } catch {
      // silent
    }
  },

  clearHistory: async () => {
    await deleteDebugHistory()
    set({ history: [], historyTotal: 0 })
  },

  deleteHistoryItem: async (id) => {
    await deleteDebugHistory(id)
    set((state) => ({
      history: state.history.filter((item) => item.id !== id),
      historyTotal: state.historyTotal - 1,
    }))
  },

  clearMessages: () => set({ messages: [], debugInfo: null }),
}))
