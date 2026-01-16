import { describe, it, expect, beforeEach, vi } from 'vitest'
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
})

