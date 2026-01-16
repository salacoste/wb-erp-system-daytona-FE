import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LogoutButton } from './LogoutButton'
import * as api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

// Mock API
vi.mock('@/lib/api', () => ({
  logoutUser: vi.fn(),
}))

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock auth store
const mockLogout = vi.fn()
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    logout: mockLogout,
  }),
}))

describe('LogoutButton', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false, gcTime: 0 },
      },
    })
    vi.clearAllMocks()
    mockPush.mockClear()
    mockLogout.mockClear()
  })

  afterEach(() => {
    cleanup()
    queryClient.clear()
  })

  const renderButton = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <LogoutButton />
      </QueryClientProvider>
    )
  }

  it('renders logout button', () => {
    renderButton()

    expect(
      screen.getByRole('button', { name: /выйти/i }),
    ).toBeInTheDocument()
  })

  it('calls logout API and clears auth state on click', async () => {
    const user = userEvent.setup()
    const mockLogoutUser = vi.mocked(api.logoutUser)
    mockLogoutUser.mockResolvedValue({ message: 'Logged out successfully' })

    const { toast } = await import('sonner')
    renderButton()

    await user.click(screen.getByRole('button', { name: /выйти/i }))

    await waitFor(
      () => {
        expect(mockLogoutUser).toHaveBeenCalled()
        expect(mockLogout).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )

    // Wait for success handling
    await waitFor(
      () => {
        expect(toast.success).toHaveBeenCalledWith('Вы вышли из аккаунта')
        expect(mockPush).toHaveBeenCalledWith('/login')
      },
      { timeout: 5000 }
    )
  })

  it('handles API failure gracefully and still logs out locally', async () => {
    const user = userEvent.setup()
    const mockLogoutUser = vi.mocked(api.logoutUser)
    mockLogoutUser.mockRejectedValue(new Error('Network error'))

    const { toast } = await import('sonner')
    renderButton()

    await user.click(screen.getByRole('button', { name: /выйти/i }))

    await waitFor(
      () => {
        expect(mockLogoutUser).toHaveBeenCalled()
        expect(mockLogout).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )

    // Should still show success and redirect even if API fails
    await waitFor(
      () => {
        expect(toast.success).toHaveBeenCalledWith('Вы вышли из аккаунта')
        expect(mockPush).toHaveBeenCalledWith('/login')
      },
      { timeout: 5000 }
    )
  })

  it('shows loading state during logout', async () => {
    const user = userEvent.setup()
    const mockLogoutUser = vi.mocked(api.logoutUser)
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    mockLogoutUser.mockReturnValue(promise as Promise<any>)

    renderButton()

    const button = screen.getByRole('button', { name: /выйти/i })
    await user.click(button)

    await waitFor(
      () => {
        expect(button).toBeDisabled()
        expect(screen.getByText(/выход.../i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Resolve to complete test
    resolvePromise!({ message: 'Logged out successfully' })

    await waitFor(
      () => {
        expect(mockLogoutUser).toHaveBeenCalled()
      },
      { timeout: 3000 }
    )
  })
})

