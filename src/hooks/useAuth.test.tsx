import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { useAuthStore } from '@/stores/authStore'
import { refreshToken } from '@/lib/api'
// Mock dependencies
vi.mock('@/stores/authStore')
vi.mock('@/lib/api')
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

    ;(refreshToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      token: 'new-token',
      user: {
        id: '1',
        email: 'test@example.com',
        role: 'Owner',
      },
    })

    renderHook(() => useAuth(), { wrapper })

    // Wait for token refresh to be called
    await waitFor(
      () => {
        expect(refreshToken).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )
  })
})

