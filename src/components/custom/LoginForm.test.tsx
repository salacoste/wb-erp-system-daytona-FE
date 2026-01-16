import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginForm } from './LoginForm'
import * as api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

// Mock API
vi.mock('@/lib/api', () => ({
  loginUser: vi.fn(),
}))

// Mock next/navigation
const mockPush = vi.fn()
const mockSearchParams = new URLSearchParams()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}))

// Mock window.location
const originalLocation = window.location

beforeAll(() => {
  delete (window as any).location
  window.location = {
    ...originalLocation,
    href: '',
  } as any
})

afterAll(() => {
  window.location = originalLocation as any
})

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

describe('LoginForm', () => {
  let queryClient: QueryClient
  const mockLogin = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false, gcTime: 0 },
      },
    })
    vi.clearAllMocks()
    mockPush.mockClear()
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      login: mockLogin,
    })
  })

  afterEach(() => {
    cleanup()
    queryClient.clear()
  })

  const renderForm = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <LoginForm />
      </QueryClientProvider>
    )
  }

  it('renders login form with email and password fields', () => {
    renderForm()

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument()
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    renderForm()

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')
    await user.tab()

    await waitFor(
      () => {
        expect(screen.getByText(/неверный формат email/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('validates password is required', async () => {
    const user = userEvent.setup()
    renderForm()

    const passwordInput = screen.getByLabelText(/пароль/i)
    await user.type(passwordInput, 'test')
    await user.clear(passwordInput)
    await user.tab()

    await waitFor(
      () => {
        expect(screen.getByText(/пароль обязателен/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('calls loginUser API on valid form submission', async () => {
    const user = userEvent.setup()
    const mockLoginUser = vi.mocked(api.loginUser)
    mockLoginUser.mockResolvedValue({
      user: {
        id: '1',
        email: 'test@example.com',
        role: 'Owner',
      },
      token: 'fake-token',
    })

    const { toast } = await import('sonner')
    renderForm()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/пароль/i), 'password123')
    await user.click(screen.getByRole('button', { name: /войти/i }))

    await waitFor(
      () => {
        expect(mockLoginUser).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
      },
      { timeout: 5000 }
    )

    // Wait for success handling
    await waitFor(
      () => {
        expect(mockLogin).toHaveBeenCalled()
        expect(toast.success).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    const mockLoginUser = vi.mocked(api.loginUser)
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    mockLoginUser.mockReturnValue(promise as Promise<any>)

    renderForm()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/пароль/i), 'password123')
    await user.click(screen.getByRole('button', { name: /войти/i }))

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /вход.../i })).toBeInTheDocument()
        expect(screen.getByRole('button')).toBeDisabled()
      },
      { timeout: 3000 }
    )

    // Resolve the promise to complete the test
    resolvePromise!({
      user: {
        id: '1',
        email: 'test@example.com',
        role: 'Owner',
      },
      token: 'fake-token',
    })

    // Wait for mutation to complete
    await waitFor(
      () => {
        expect(mockLoginUser).toHaveBeenCalled()
      },
      { timeout: 3000 }
    )
  })

  it('handles invalid credentials error', async () => {
    const user = userEvent.setup()
    const mockLoginUser = vi.mocked(api.loginUser)
    mockLoginUser.mockRejectedValue(new Error('Invalid credentials'))

    const { toast } = await import('sonner')
    renderForm()

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com')
    await user.type(screen.getByLabelText(/пароль/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /войти/i }))

    // Wait for API call and error handling
    await waitFor(
      () => {
        expect(mockLoginUser).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )

    // Wait for toast to be called
    await waitFor(
      () => {
        expect(toast.error).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )

    // Verify the error message
    expect(toast.error).toHaveBeenCalledWith('Неверный email или пароль')
  })

  it('handles network errors', async () => {
    const user = userEvent.setup()
    const mockLoginUser = vi.mocked(api.loginUser)
    mockLoginUser.mockRejectedValue(new Error('Network error'))

    const { toast } = await import('sonner')
    renderForm()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/пароль/i), 'password123')
    await user.click(screen.getByRole('button', { name: /войти/i }))

    // Wait for API call and error handling
    await waitFor(
      () => {
        expect(mockLoginUser).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )

    // Wait for toast to be called
    await waitFor(
      () => {
        expect(toast.error).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )

    // Verify the error message
    expect(toast.error).toHaveBeenCalledWith('Неверный email или пароль')
  })

  it('stores user and token in auth store on success', async () => {
    const user = userEvent.setup()
    const mockLoginUser = vi.mocked(api.loginUser)
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'Owner' as const,
      cabinet_ids: ['cabinet-1'],
    }
    mockLoginUser.mockResolvedValue({
      user: mockUser,
      token: 'fake-token',
    })

    renderForm()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/пароль/i), 'password123')
    await user.click(screen.getByRole('button', { name: /войти/i }))

    await waitFor(
      () => {
        expect(mockLogin).toHaveBeenCalledWith(
          mockUser,
          'fake-token',
          'cabinet-1',
        )
      },
      { timeout: 5000 }
    )
  })

  it('redirects to dashboard on successful login', async () => {
    const user = userEvent.setup()
    const mockLoginUser = vi.mocked(api.loginUser)
    mockLoginUser.mockResolvedValue({
      user: {
        id: '1',
        email: 'test@example.com',
        role: 'Owner',
      },
      token: 'fake-token',
    })

    // Clear any existing href before test
    window.location.href = ''

    renderForm()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/пароль/i), 'password123')
    await user.click(screen.getByRole('button', { name: /войти/i }))

    await waitFor(
      () => {
        expect(window.location.href).toBe('/dashboard')
      },
      { timeout: 5000 }
    )
  })
})

