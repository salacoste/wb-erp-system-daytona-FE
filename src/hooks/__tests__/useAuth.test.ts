/**
 * Unit tests for useAuth hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useAuth } from '../useAuth'

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  refreshToken: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  isTokenExpired: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn() },
}))

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { refreshToken } from '@/lib/api'
import { isTokenExpired } from '@/lib/auth'

const mockRouter = { push: vi.fn() }
const mockUseRouter = vi.mocked(useRouter)
const mockUseAuthStore = vi.mocked(useAuthStore)
const mockRefreshToken = vi.mocked(refreshToken)
const mockIsTokenExpired = vi.mocked(isTokenExpired)

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockUseRouter.mockReturnValue(mockRouter as unknown as ReturnType<typeof useRouter>)
    mockUseAuthStore.mockReturnValue({
      token: 'valid-token',
      user: { id: '1', email: 'test@test.com', role: 'Owner', name: 'Test' },
      login: vi.fn(),
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuthStore>)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns isAuthenticated true when token exists and is not expired', () => {
    mockIsTokenExpired.mockReturnValue(false)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.token).toBe('valid-token')
    expect(result.current.user?.email).toBe('test@test.com')
  })

  it('returns isAuthenticated false when no token', () => {
    mockUseAuthStore.mockReturnValue({
      token: null,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuthStore>)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    expect(result.current.isAuthenticated).toBe(false)
  })

  it('returns isAuthenticated false when token is expired', () => {
    mockIsTokenExpired.mockReturnValue(true)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    expect(result.current.isAuthenticated).toBe(false)
  })

  it('does not attempt refresh when no token', () => {
    mockUseAuthStore.mockReturnValue({
      token: null,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuthStore>)

    renderHook(() => useAuth(), { wrapper: createWrapper() })

    expect(mockRefreshToken).not.toHaveBeenCalled()
  })

  it('refreshes token when expired', async () => {
    const mockLogin = vi.fn()
    mockIsTokenExpired.mockReturnValue(true)
    mockUseAuthStore.mockReturnValue({
      token: 'expired-token',
      user: { id: '1', email: 'test@test.com', role: 'Owner' },
      login: mockLogin,
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuthStore>)
    mockRefreshToken.mockResolvedValueOnce({
      token: 'new-token',
      user: { id: '1', email: 'test@test.com', role: 'Owner' },
    })

    renderHook(() => useAuth(), { wrapper: createWrapper() })

    await act(async () => {
      await vi.runOnlyPendingTimersAsync()
    })

    expect(mockRefreshToken).toHaveBeenCalledWith('expired-token')
    expect(mockLogin).toHaveBeenCalled()
  })

  it('logs out and redirects on refresh failure', async () => {
    const mockLogout = vi.fn()
    mockIsTokenExpired.mockReturnValue(true)
    mockUseAuthStore.mockReturnValue({
      token: 'expired-token',
      user: { id: '1', email: 'test@test.com', role: 'Owner' },
      login: vi.fn(),
      logout: mockLogout,
    } as unknown as ReturnType<typeof useAuthStore>)
    mockRefreshToken.mockRejectedValueOnce(new Error('Refresh failed'))

    renderHook(() => useAuth(), { wrapper: createWrapper() })

    await act(async () => {
      await vi.runOnlyPendingTimersAsync()
    })

    expect(mockLogout).toHaveBeenCalled()
    expect(mockRouter.push).toHaveBeenCalledWith('/login')
  })

  it('returns refreshTokenIfNeeded function', () => {
    mockIsTokenExpired.mockReturnValue(false)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    expect(typeof result.current.refreshToken).toBe('function')
  })
})
