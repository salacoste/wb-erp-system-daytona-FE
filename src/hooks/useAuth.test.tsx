import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useAuthStore } from '@/stores/authStore'
import { getFreshToken } from '@/lib/api-client-refresh'
// Mock dependencies
vi.mock('@/stores/authStore')
// D-2 pass-1 (OQ1, 2026-09-03): the hook's proactive path no longer calls the
// `refreshToken()` API fn — it routes through the single-flight core
// `getFreshToken()` (the same engine as the reactive 401 interceptor; the
// store update happens INSIDE it). This file full-mocks the authStore, so the
// single-flight core MUST be mocked too — otherwise its real
// `useAuthStore.getState()` would hit an auto-mocked store (getState →
// undefined) and throw inside the hook's mount effect.
vi.mock('@/lib/api-client-refresh', () => ({
  getFreshToken: vi.fn(),
}))
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}))

describe('useAuth', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false, gcTime: 0 },
      },
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('returns authentication state correctly', () => {
    const mockToken = 'valid-token'
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'Owner' as const,
    }

    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      token: mockToken,
      user: mockUser,
      login: vi.fn(),
      logout: vi.fn(),
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isAuthenticated).toBeDefined()
    expect(result.current.token).toBe(mockToken)
    expect(result.current.user).toEqual(mockUser)
  })

  it('refreshes token when expired', async () => {
    // Create expired token (expired 1 hour ago)
    const expiredTime = Math.floor((Date.now() - 3600000) / 1000)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(JSON.stringify({ exp: expiredTime }))
    const expiredToken = `${header}.${payload}.signature`

    const mockLogin = vi.fn()
    const mockLogout = vi.fn()

    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      token: expiredToken,
      user: { id: '1', email: 'test@example.com', role: 'Owner' },
      login: mockLogin,
      logout: mockLogout,
    })
    ;(getFreshToken as ReturnType<typeof vi.fn>).mockResolvedValue(true)

    renderHook(() => useAuth(), { wrapper })

    // Wait for the single-flight core to be called by the proactive path
    // (OQ1: the hook delegates the rotation + store update to getFreshToken).
    await waitFor(
      () => {
        expect(getFreshToken).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )
  })
})
