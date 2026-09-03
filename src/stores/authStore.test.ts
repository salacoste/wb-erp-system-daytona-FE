import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'
import type { User } from '@/types/auth'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('authStore', () => {
  beforeEach(() => {
    // Clear store before each test
    useAuthStore.getState().logout()
    localStorageMock.clear()
  })

  it('initializes with null values', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.cabinetId).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('sets user correctly', () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      role: 'Owner',
    }

    useAuthStore.getState().setUser(user)

    const state = useAuthStore.getState()
    expect(state.user).toEqual(user)
    expect(state.isAuthenticated).toBe(true)
  })

  it('sets token correctly', () => {
    const token = 'fake-token'

    useAuthStore.getState().setToken(token)

    const state = useAuthStore.getState()
    expect(state.token).toBe(token)
  })

  it('sets cabinet ID correctly', () => {
    const cabinetId = 'cabinet-1'

    useAuthStore.getState().setCabinetId(cabinetId)

    const state = useAuthStore.getState()
    expect(state.cabinetId).toBe(cabinetId)
  })

  it('login sets all auth state correctly', () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      role: 'Owner',
      cabinet_ids: ['cabinet-1'],
    }
    const token = 'fake-token'

    useAuthStore.getState().login(user, token)

    const state = useAuthStore.getState()
    expect(state.user).toEqual(user)
    expect(state.token).toBe(token)
    expect(state.cabinetId).toBe('cabinet-1')
    expect(state.isAuthenticated).toBe(true)
  })

  it('login uses provided cabinet ID over user cabinet_ids', () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      role: 'Owner',
      cabinet_ids: ['cabinet-1'],
    }
    const token = 'fake-token'

    useAuthStore.getState().login(user, token, 'cabinet-2')

    const state = useAuthStore.getState()
    expect(state.cabinetId).toBe('cabinet-2')
  })

  it('logout clears all auth state', () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      role: 'Owner',
    }
    const token = 'fake-token'

    useAuthStore.getState().login(user, token)
    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.cabinetId).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  // Note: Persistence to localStorage is handled by Zustand persist middleware
  // and is tested implicitly through the store's behavior. Direct localStorage
  // testing is complex due to async persistence timing.

  // Backend ↔ frontend role-case bridge — see `normalizeUser` in authStore.ts.
  // Backend's UserRole enum emits lowercase values; the frontend type and every
  // role comparison expects capitalized variants. These tests lock in the
  // single-boundary normalization so no future regression slips through.
  describe('role case normalization', () => {
    it('normalizes lowercase role from backend on setUser', () => {
      // Cast through unknown because the type forbids lowercase, but the
      // actual API payload (verified against /v1/auth/login) returns lowercase.
      const backendUser = {
        id: '1',
        email: 'test@test.com',
        role: 'owner',
        cabinet_ids: ['c1'],
      } as unknown as User

      useAuthStore.getState().setUser(backendUser)

      expect(useAuthStore.getState().user?.role).toBe('Owner')
    })

    it('normalizes lowercase role on login', () => {
      const backendUser = {
        id: '1',
        email: 'test@test.com',
        role: 'manager',
        cabinet_ids: ['c1'],
      } as unknown as User

      useAuthStore.getState().login(backendUser, 'token')

      expect(useAuthStore.getState().user?.role).toBe('Manager')
    })

    it('normalizes lowercase role on refreshToken when user is provided', () => {
      const backendUser = {
        id: '1',
        email: 'test@test.com',
        role: 'analyst',
        cabinet_ids: ['c1'],
      } as unknown as User

      useAuthStore.getState().refreshToken('new-token', backendUser)

      expect(useAuthStore.getState().user?.role).toBe('Analyst')
    })

    it('passes through already-canonical capitalized roles unchanged', () => {
      const canonicalUser: User = {
        id: '1',
        email: 'test@test.com',
        role: 'Owner',
        cabinet_ids: ['c1'],
      }

      useAuthStore.getState().setUser(canonicalUser)

      expect(useAuthStore.getState().user?.role).toBe('Owner')
    })
  })

  // D-2 (PB-3, 2026-09-03) — contract annex hazard #2 pinned at the store
  // level: token refresh (proactive useAuth path + reactive api-client
  // interceptor) MUST go through `refreshToken()` (nonce-preserving) because
  // in-flight D-1 (Story 167.9) cabinet-create settlements compare nonces.
  // `login()` is the ONLY action that mints a new session identity.
  describe('session nonce semantics (D-2/PB-3 hazard #2)', () => {
    it('login() mints a fresh sessionNonce on every login', () => {
      const user: User = { id: '1', email: 'test@example.com', role: 'Owner' }

      useAuthStore.getState().login(user, 'token-1')
      const firstNonce = useAuthStore.getState().sessionNonce
      expect(firstNonce).toBeTruthy()

      useAuthStore.getState().login(user, 'token-2')
      const secondNonce = useAuthStore.getState().sessionNonce
      expect(secondNonce).toBeTruthy()
      expect(secondNonce).not.toBe(firstNonce)
    })

    it('refreshToken(token) preserves sessionNonce while rotating the token', () => {
      const user: User = { id: '1', email: 'test@example.com', role: 'Owner' }
      useAuthStore.getState().login(user, 'token-1')
      const nonceBefore = useAuthStore.getState().sessionNonce

      useAuthStore.getState().refreshToken('token-2')

      const state = useAuthStore.getState()
      expect(state.token).toBe('token-2')
      expect(state.sessionNonce).toBe(nonceBefore)
    })

    it('refreshToken(token, user) preserves sessionNonce while updating the user', () => {
      useAuthStore.getState().login({ id: '1', email: 'old@example.com', role: 'Owner' }, 'token-1')
      const nonceBefore = useAuthStore.getState().sessionNonce

      useAuthStore.getState().refreshToken('token-2', {
        id: '1',
        email: 'new@example.com',
        role: 'Owner',
      })

      const state = useAuthStore.getState()
      expect(state.token).toBe('token-2')
      expect(state.user?.email).toBe('new@example.com')
      expect(state.sessionNonce).toBe(nonceBefore)
    })
  })
})
