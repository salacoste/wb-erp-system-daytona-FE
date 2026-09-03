/**
 * Unit tests for useAuth hook
 *
 * D-2 (PB-3, 2026-09-03): the proactive refresh path updates the store via
 * the `refreshToken(token, user)` STORE ACTION (nonce-preserving), never via
 * `login()` — login() mints a new sessionNonce and would break in-flight D-1
 * (Story 167.9) cabinet-create settlements. Contract annex hazard #2 in
 * docs/request-backend/230-auth-refresh-endpoint-missing.md.
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
// D-2: the STORE action the proactive path must call (alias — same-name
// function rule; the API fn is `refreshToken` from '@/lib/api' above).
const mockRefreshTokenStore = vi.fn()

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
      refreshToken: mockRefreshTokenStore,
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

  it('refreshes token when expired via the nonce-preserving store action, not login()', async () => {
    const mockLogin = vi.fn()
    mockIsTokenExpired.mockReturnValue(true)
    mockUseAuthStore.mockReturnValue({
      token: 'expired-token',
      user: { id: '1', email: 'test@test.com', role: 'Owner' },
      login: mockLogin,
      logout: vi.fn(),
      refreshToken: mockRefreshTokenStore,
    } as unknown as ReturnType<typeof useAuthStore>)
    const responseUser = { id: '1', email: 'test@test.com', role: 'Owner' as const }
    mockRefreshToken.mockResolvedValueOnce({
      token: 'new-token',
      user: responseUser,
    })

    renderHook(() => useAuth(), { wrapper: createWrapper() })

    await act(async () => {
      await vi.runOnlyPendingTimersAsync()
    })

    expect(mockRefreshToken).toHaveBeenCalledWith('expired-token')
    // D-2 hazard #2 pin: the STORE refreshToken action updates (token, user).
    expect(mockRefreshTokenStore).toHaveBeenCalledWith('new-token', responseUser)
    // login() mints a new sessionNonce — it must NOT run on token refresh.
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('keeps the existing user when the refresh response omits user', async () => {
    const mockLogin = vi.fn()
    mockIsTokenExpired.mockReturnValue(true)
    const existingUser = { id: '1', email: 'test@test.com', role: 'Owner' }
    mockUseAuthStore.mockReturnValue({
      token: 'expired-token',
      user: existingUser,
      login: mockLogin,
      logout: vi.fn(),
      refreshToken: mockRefreshTokenStore,
    } as unknown as ReturnType<typeof useAuthStore>)
    mockRefreshToken.mockResolvedValueOnce({ token: 'new-token' })

    renderHook(() => useAuth(), { wrapper: createWrapper() })

    await act(async () => {
      await vi.runOnlyPendingTimersAsync()
    })

    // No user in the response → the store action receives the existing user
    // (it keeps state.user when none is passed) and login() still never runs.
    expect(mockRefreshTokenStore).toHaveBeenCalledWith('new-token', existingUser)
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('does not update the store when no user is available at all', async () => {
    const mockLogin = vi.fn()
    mockIsTokenExpired.mockReturnValue(true)
    mockUseAuthStore.mockReturnValue({
      token: 'expired-token',
      user: null,
      login: mockLogin,
      logout: vi.fn(),
      refreshToken: mockRefreshTokenStore,
    } as unknown as ReturnType<typeof useAuthStore>)
    mockRefreshToken.mockResolvedValueOnce({ token: 'new-token' })

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await act(async () => {
      await vi.runOnlyPendingTimersAsync()
    })

    // Graceful no-op (parity with the pre-D-2 branch): warn, update nothing.
    expect(mockRefreshTokenStore).not.toHaveBeenCalled()
    expect(mockLogin).not.toHaveBeenCalled()
    expect(result.current.refreshToken).toBeInstanceOf(Function)
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
