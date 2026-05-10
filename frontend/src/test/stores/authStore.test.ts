import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/auth'

const { mockAuthApiLogout } = vi.hoisted(() => ({
  mockAuthApiLogout: vi.fn(),
}))

vi.mock('@/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    logout: mockAuthApiLogout,
    getMe: vi.fn(),
  },
}))

describe('authStore', () => {
  beforeEach(() => {
    // Reset the store to initial state before each test
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false })
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  describe('login', () => {
    it('should set token, user and mark as authenticated', () => {
      const user = { id: 1, name: '管理员', email: 'admin@example.com' }
      const token = 'jwt-token-abc-123'

      useAuthStore.getState().login(token, user)

      const state = useAuthStore.getState()
      expect(state.token).toBe(token)
      expect(state.user).toEqual(user)
      expect(state.isAuthenticated).toBe(true)
    })

    it('should overwrite previous login state', () => {
      // First login
      useAuthStore.getState().login('old-token', { id: 1, name: 'Admin', email: 'admin@test.com' })

      // Second login with different data
      const newUser = { id: 2, name: 'NewAdmin', email: 'newadmin@test.com' }
      useAuthStore.getState().login('new-token', newUser)

      const state = useAuthStore.getState()
      expect(state.token).toBe('new-token')
      expect(state.user).toEqual(newUser)
    })
  })

  describe('logout', () => {
    it('should call authApi.logout and clear all state', async () => {
      // Pre-set logged-in state
      useAuthStore.setState({
        token: 'test-token',
        user: { id: 1, name: '管理员', email: 'admin@example.com' },
        isAuthenticated: true,
      })
      mockAuthApiLogout.mockResolvedValue(undefined)

      await useAuthStore.getState().logout()

      expect(mockAuthApiLogout).toHaveBeenCalledTimes(1)
      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it('should clear state even if authApi.logout throws an error', async () => {
      useAuthStore.setState({
        token: 'test-token',
        user: { id: 1, name: '管理员', email: 'admin@example.com' },
        isAuthenticated: true,
      })
      mockAuthApiLogout.mockRejectedValue(new Error('Network Error'))

      // Should not throw despite the API error
      await expect(useAuthStore.getState().logout()).resolves.toBeUndefined()

      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('state transitions', () => {
    it('should transition from unauthenticated → authenticated → unauthenticated', async () => {
      // Start unauthenticated
      expect(useAuthStore.getState().isAuthenticated).toBe(false)

      // Login
      useAuthStore.getState().login('token', { id: 1, name: 'User', email: 'user@test.com' })
      expect(useAuthStore.getState().isAuthenticated).toBe(true)

      // Logout
      mockAuthApiLogout.mockResolvedValue(undefined)
      await useAuthStore.getState().logout()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })
})
