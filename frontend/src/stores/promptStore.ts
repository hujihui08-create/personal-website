import { create } from 'zustand'
import type { PromptTemplate } from '@/types'
import {
  listPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
  setDefaultPrompt,
} from '@/api/prompts'

interface PromptState {
  prompts: PromptTemplate[]
  total: number
  isLoading: boolean

  loadPrompts: (agentType?: string, page?: number) => Promise<void>
  addPrompt: (data: Parameters<typeof createPrompt>[0]) => Promise<PromptTemplate | null>
  editPrompt: (
    id: number,
    data: Parameters<typeof updatePrompt>[1]
  ) => Promise<PromptTemplate | null>
  removePrompt: (id: number) => Promise<void>
  setDefault: (id: number) => Promise<void>
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: [],
  total: 0,
  isLoading: false,

  loadPrompts: async (agentType, page = 1) => {
    set({ isLoading: true })
    try {
      const result = await listPrompts({ agent_type: agentType, page, page_size: 20 })
      set({
        prompts: result.items || result.data || [],
        total: result.total || result.pagination?.total || 0,
      })
    } finally {
      set({ isLoading: false })
    }
  },

  addPrompt: async (data) => {
    try {
      const prompt = await createPrompt(data)
      set((state) => ({ prompts: [prompt, ...state.prompts] }))
      return prompt
    } catch {
      return null
    }
  },

  editPrompt: async (id, data) => {
    try {
      const prompt = await updatePrompt(id, data)
      set((state) => ({
        prompts: state.prompts.map((p) => (p.id === id ? prompt : p)),
      }))
      return prompt
    } catch {
      return null
    }
  },

  removePrompt: async (id) => {
    await deletePrompt(id)
    set((state) => ({
      prompts: state.prompts.filter((p) => p.id !== id),
    }))
  },

  setDefault: async (id) => {
    const prompt = get().prompts.find((p) => p.id === id)
    if (!prompt) return
    await setDefaultPrompt(id)
    set((state) => ({
      prompts: state.prompts.map((p) => ({
        ...p,
        is_default: p.id === id ? true : p.agent_type === prompt.agent_type ? false : p.is_default,
      })),
    }))
  },
}))
