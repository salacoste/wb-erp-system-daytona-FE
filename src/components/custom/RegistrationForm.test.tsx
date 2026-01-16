import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RegistrationForm } from './RegistrationForm'
import * as api from '@/lib/api'

// Mock API
vi.mock('@/lib/api', () => ({
  registerUser: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('RegistrationForm', () => {
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
    cleanup()
    queryClient.clear()
  })

  const renderForm = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <RegistrationForm />
      </QueryClientProvider>
    )
  }

  it('renders registration form with email and password fields', () => {
    renderForm()

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /зарегистрироваться/i })).toBeInTheDocument()
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

  it('validates password minimum length', async () => {
    const user = userEvent.setup()
    renderForm()

    const passwordInput = screen.getByLabelText(/пароль/i)
    await user.type(passwordInput, 'short')
    await user.tab()

    await waitFor(
      () => {
        expect(
          screen.getByText(/пароль должен содержать минимум 8 символов/i)
        ).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('disables submit button during submission', async () => {
    const user = userEvent.setup()
    const mockRegisterUser = vi.mocked(api.registerUser)
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    mockRegisterUser.mockReturnValue(promise as Promise<any>)

    renderForm()

    const submitButton = screen.getByRole('button', { name: /зарегистрироваться/i })
    expect(submitButton).not.toBeDisabled()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/пароль/i), 'password123')
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(screen.getByRole('button')).toBeDisabled()
      },
      { timeout: 3000 }
    )

    // Resolve to complete test
    resolvePromise!({
      user: {
        id: '1',
        email: 'test@example.com',
        role: 'Owner',
      },
    })
  })

  it('calls registerUser API on valid form submission', async () => {
    const user = userEvent.setup()
    const mockRegisterUser = vi.mocked(api.registerUser)
    mockRegisterUser.mockResolvedValue({
      user: {
        id: '1',
        email: 'test@example.com',
        role: 'Owner',
      },
    })

    renderForm()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/пароль/i), 'password123')
    await user.click(screen.getByRole('button', { name: /зарегистрироваться/i }))

    await waitFor(
      () => {
        expect(mockRegisterUser).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
      },
      { timeout: 3000 }
    )
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    const mockRegisterUser = vi.mocked(api.registerUser)
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    mockRegisterUser.mockReturnValue(promise as Promise<any>)

    renderForm()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/пароль/i), 'password123')
    await user.click(screen.getByRole('button', { name: /зарегистрироваться/i }))

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /регистрация.../i })).toBeInTheDocument()
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
    })

    // Wait for mutation to complete
    await waitFor(
      () => {
        expect(mockRegisterUser).toHaveBeenCalled()
      },
      { timeout: 3000 }
    )
  })

  it('handles duplicate email error', async () => {
    const user = userEvent.setup()
    const mockRegisterUser = vi.mocked(api.registerUser)
    // Use error message that will trigger duplicate email handling
    const error = new Error('duplicate email')
    mockRegisterUser.mockRejectedValue(error)

    const { toast } = await import('sonner')
    renderForm()

    await user.type(screen.getByLabelText(/email/i), 'existing@example.com')
    await user.type(screen.getByLabelText(/пароль/i), 'password123')
    await user.click(screen.getByRole('button', { name: /зарегистрироваться/i }))

    // Wait for API call and error handling
    await waitFor(
      () => {
        expect(mockRegisterUser).toHaveBeenCalled()
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

    // Verify the error message contains expected text
    expect(toast.error).toHaveBeenCalledWith(
      'Этот email уже зарегистрирован. Пожалуйста, войдите.'
    )
  })

  it('handles network errors', async () => {
    const user = userEvent.setup()
    const mockRegisterUser = vi.mocked(api.registerUser)
    mockRegisterUser.mockRejectedValue(new Error('Network error'))

    const { toast } = await import('sonner')
    renderForm()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/пароль/i), 'password123')
    await user.click(screen.getByRole('button', { name: /зарегистрироваться/i }))

    await waitFor(
      () => {
        expect(mockRegisterUser).toHaveBeenCalled()
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Ошибка регистрации')
        )
      },
      { timeout: 5000 }
    )
  })
})

