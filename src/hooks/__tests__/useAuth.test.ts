/**
 * Unit tests for useAuth hook
 *
 * D-2 (PB-3, 2026-09-03): the proactive refresh path updates the store via
 * the `refreshToken(token, user)` STORE ACTION (nonce-preserving), never via
 * `login()` — login() mints a new sessionNonce and would break in-flight D-1
 * (Story 167.9) cabinet-create settlements. Contract annex hazard #2 in
 * docs/request-backend/230-auth-refresh-endpoint-missing.md.
 *
 * D-2 pass-1 (OQ1, 2026-09-03): the proactive path no longer owns ANY refresh
 * mechanics — it routes through `getFreshToken()` (the same single-flight core
 * the reactive interceptor uses; no failed-header arg — proactive has no wire
 * token). The store update happens INSIDE getFreshToken; the hook only maps
 * its boolean to return-true vs logout+redirect. These tests mock the
 * single-flight core and pin the delegation contract.
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

// OQ1: the proactive path's ONLY refresh dependency is the single-flight core.
vi.mock('@/lib/api-client-refresh', () => ({
  getFreshToken: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  isTokenExpired: vi.fn(),
}))

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { getFreshToken } from '@/lib/api-client-refresh'
import { isTokenExpired } from '@/lib/auth'

const mockRouter = { push: vi.fn() }
const mockUseRouter = vi.mocked(useRouter)
const mockUseAuthStore = vi.mocked(useAuthStore)
const mockGetFreshToken = vi.mocked(getFreshToken)
const mockLogout = vi.fn()
const mockLogin = vi.fn()

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
      login: mockLogin,
      logout: mockLogout,
    } as unknown as ReturnType<typeof useAuthStore>)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns isAuthenticated true when token exists and is not expired', () => {
    vi.mocked(isTokenExpired).mockReturnValue(false)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.token).toBe('valid-token')
    expect(result.current.user?.email).toBe('test@test.com')
  })

  it('returns isAuthenticated false when no token', () => {
    mockUseAuthStore.mockReturnValue({
      token: null,
      user: null,
      login: mockLogin,
      logout: mockLogout,
    } as unknown as ReturnType<typeof useAuthStore>)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    expect(result.current.isAuthenticated).toBe(false)
  })

  it('returns isAuthenticated false when token is expired', () => {
    vi.mocked(isTokenExpired).mockReturnValue(true)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    expect(result.current.isAuthenticated).toBe(false)
  })

  it('does not call getFreshToken when no token', () => {
    mockUseAuthStore.mockReturnValue({
      token: null,
      user: null,
      login: mockLogin,
      logout: mockLogout,
    } as unknown as ReturnType<typeof useAuthStore>)

    renderHook(() => useAuth(), { wrapper: createWrapper() })

    expect(mockGetFreshToken).not.toHaveBeenCalled()
  })

  it('expired token routes through the single-flight getFreshToken; the hook owns NO store update', async () => {
    vi.mocked(isTokenExpired).mockReturnValue(true)
    // The rotation + nonce-preserving store update happen INSIDE getFreshToken.
    mockGetFreshToken.mockResolvedValue(true)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    let outcome: boolean | undefined
    await act(async () => {
      outcome = await result.current.refreshToken()
    })

    // OQ1 delegation pin: no failed-header arg on the proactive path.
    expect(mockGetFreshToken).toHaveBeenCalledWith()
    expect(outcome).toBe(true)
    // The hook never touches the store itself — no store update, no login().
    expect(mockLogin).not.toHaveBeenCalled()
    expect(mockLogout).not.toHaveBeenCalled()
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('logs out and redirects when recovery fails (getFreshToken resolves false)', async () => {
    vi.mocked(isTokenExpired).mockReturnValue(true)
    mockGetFreshToken.mockResolvedValue(false)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    let outcome: boolean | undefined
    await act(async () => {
      outcome = await result.current.refreshToken()
    })

    expect(outcome).toBe(false)
    expect(mockLogout).toHaveBeenCalled()
    expect(mockRouter.push).toHaveBeenCalledWith('/login')
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('returns refreshTokenIfNeeded function', () => {
    vi.mocked(isTokenExpired).mockReturnValue(false)

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    expect(typeof result.current.refreshToken).toBe('function')
  })
})
