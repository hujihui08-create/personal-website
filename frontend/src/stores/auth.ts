import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/api/auth'

interface User {
  id: number
  name: string
  email: string
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: async () => {
        try {
          await authApi.logout()
        } catch {
          // ignore error
        }
        set({ token: null, user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
