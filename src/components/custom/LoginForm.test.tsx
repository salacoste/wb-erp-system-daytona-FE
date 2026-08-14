import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderToStaticMarkup } from 'react-dom/server'
import { axe, toHaveNoViolations } from 'jest-axe'
import { readFileSync } from 'node:fs'
import { LoginForm } from './LoginForm'
import * as api from '@/lib/api'
import type { LoginResponse } from '@/types/auth'
import { ApiError } from '@/types/api'
import { useAuthStore } from '@/stores/authStore'

expect.extend(toHaveNoViolations)

// Mock API
vi.mock('@/lib/api', () => ({
  loginUser: vi.fn(),
}))

// Mock next/navigation
const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: navigationMocks.push,
  }),
  useSearchParams: () => navigationMocks.searchParams,
}))

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
  let mockNavigate: ReturnType<typeof vi.fn<(href: string) => void>>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false, gcTime: 0 },
      },
    })
    mockNavigate = vi.fn<(href: string) => void>()
    vi.clearAllMocks()
    navigationMocks.searchParams = new URLSearchParams()
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      login: mockLogin,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanup()
    queryClient.clear()
  })

  const renderForm = (search = '') => {
    navigationMocks.searchParams = new URLSearchParams(search)
    return render(
      <QueryClientProvider client={queryClient}>
        <LoginForm navigate={mockNavigate} />
      </QueryClientProvider>
    )
  }

  const validResponse = (cabinetIds?: string[]): LoginResponse => ({
    user: {
      id: 'synthetic-user',
      email: 'user@example.test',
      role: 'Owner',
      cabinet_ids: cabinetIds,
    },
    token: 'synthetic-jwt',
  })

  const fillValidCredentials = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText(/^email/i), 'user@example.test')
    await user.type(screen.getByLabelText(/^пароль/i), 'synthetic-password')
  }

  it('renders login form with email and password fields', () => {
    renderForm()

    const email = screen.getByLabelText(/^email/i)
    const password = screen.getByLabelText(/^пароль/i)
    const submit = screen.getByRole('button', { name: /войти/i })

    expect(email).toHaveAttribute('type', 'email')
    expect(email).toHaveAttribute('autocomplete', 'email')
    expect(password).toHaveAttribute('type', 'password')
    expect(password).toHaveAttribute('autocomplete', 'current-password')
    expect(submit).toHaveAttribute('type', 'submit')
    expect(submit).toHaveClass('w-full')
  })

  it('renders disabled but not busy controls before hydration without a native password-submit URL', () => {
    navigationMocks.searchParams = new URLSearchParams('redirect=%2Forders')
    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <LoginForm navigate={mockNavigate} />
      </QueryClientProvider>
    )
    const document = new DOMParser().parseFromString(html, 'text/html')
    const form = document.querySelector('form')

    expect(document.querySelector('input[type="email"]')?.hasAttribute('disabled')).toBe(true)
    expect(document.querySelector('input[type="password"]')?.hasAttribute('disabled')).toBe(true)
    const submit = document.querySelector('button[type="submit"]')

    expect(submit?.hasAttribute('disabled')).toBe(true)
    expect(form?.hasAttribute('method')).toBe(false)
    expect(form?.hasAttribute('action')).toBe(false)
    expect({
      ariaBusy: submit?.getAttribute('aria-busy'),
      visibleLabel: submit?.textContent,
    }).toEqual({
      ariaBusy: 'false',
      visibleLabel: 'Войти',
    })
    expect(window.location.href).not.toContain('synthetic-password')
    expect(api.loginUser).not.toHaveBeenCalled()
  })

  it('focuses email after hydration', async () => {
    renderForm()

    await waitFor(() => expect(screen.getByLabelText(/^email/i)).toHaveFocus())
  })

  it('supports the email-password-submit keyboard order', async () => {
    const user = userEvent.setup()
    renderForm()

    await waitFor(() => expect(screen.getByLabelText(/^email/i)).toBeEnabled())
    screen.getByLabelText(/^email/i).focus()
    await user.tab()
    expect(screen.getByLabelText(/^пароль/i)).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: /войти/i })).toHaveFocus()
  })

  it('has no automated accessibility violations in the hydrated default state', async () => {
    const { container } = renderForm()

    await waitFor(() => expect(screen.getByLabelText(/^email/i)).toBeEnabled())
    expect(await axe(container)).toHaveNoViolations()
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

  it('focuses the first invalid field and makes no login call on invalid submission', async () => {
    const user = userEvent.setup()
    renderForm()

    await waitFor(() => expect(screen.getByLabelText(/^email/i)).toBeEnabled())
    await user.click(screen.getByRole('button', { name: /войти/i }))

    expect(await screen.findByText('Email обязателен')).toBeInTheDocument()
    expect(screen.getByLabelText(/^email/i)).toHaveFocus()
    expect(api.loginUser).not.toHaveBeenCalled()
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

  it('disables every control and exposes a truthful busy state while submission is pending', async () => {
    const user = userEvent.setup()
    const mockLoginUser = vi.mocked(api.loginUser)
    let resolvePromise: (value: LoginResponse) => void
    const promise = new Promise<LoginResponse>(resolve => {
      resolvePromise = resolve
    })
    mockLoginUser.mockReturnValue(promise)

    renderForm()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/пароль/i), 'password123')
    await user.click(screen.getByRole('button', { name: /войти/i }))

    await waitFor(
      () => {
        expect(screen.getByLabelText(/^email/i)).toBeDisabled()
        expect(screen.getByLabelText(/^пароль/i)).toBeDisabled()
        expect(screen.getByRole('button', { name: /вход.../i })).toBeDisabled()
        expect(screen.getByRole('button', { name: /вход.../i })).toHaveAttribute(
          'aria-busy',
          'true'
        )
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

  it('does not create a second login call from repeated click or Enter while pending', async () => {
    const user = userEvent.setup()
    let resolvePromise: (value: LoginResponse) => void
    vi.mocked(api.loginUser).mockReturnValue(
      new Promise<LoginResponse>(resolve => {
        resolvePromise = resolve
      })
    )
    const { container } = renderForm()

    await fillValidCredentials(user)
    const submit = screen.getByRole('button', { name: /войти/i })
    await user.click(submit)
    await waitFor(() => expect(api.loginUser).toHaveBeenCalledTimes(1))

    fireEvent.click(submit)
    fireEvent.keyDown(container.querySelector('form')!, { key: 'Enter', code: 'Enter' })
    expect(api.loginUser).toHaveBeenCalledTimes(1)

    resolvePromise!(validResponse())
  })

  it('locks out a second valid submission before the pending render commits', async () => {
    let resolvePromise: (value: LoginResponse) => void
    vi.mocked(api.loginUser).mockReturnValue(
      new Promise<LoginResponse>(resolve => {
        resolvePromise = resolve
      })
    )
    const { container } = renderForm()

    await waitFor(() => expect(screen.getByLabelText(/^email/i)).toBeEnabled())
    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: 'user@example.test' },
    })
    fireEvent.change(screen.getByLabelText(/^пароль/i), {
      target: { value: 'synthetic-password' },
    })

    const formElement = container.querySelector('form')!
    fireEvent.submit(formElement)
    fireEvent.submit(formElement)

    await waitFor(() => expect(api.loginUser).toHaveBeenCalledTimes(1))
    resolvePromise!(validResponse())
  })

  it('shows associated generic feedback and restores password focus after invalid credentials', async () => {
    const user = userEvent.setup()
    const mockLoginUser = vi.mocked(api.loginUser)
    mockLoginUser.mockRejectedValue(new ApiError('backend detail must stay private', 401))
    renderForm()

    const email = screen.getByLabelText(/^email/i)
    const password = screen.getByLabelText(/^пароль/i)
    await user.type(email, 'wrong@example.test')
    await user.type(password, 'synthetic-password')
    await user.click(screen.getByRole('button', { name: /войти/i }))

    const feedback = await screen.findByRole('alert')
    expect(feedback).toHaveTextContent('Неверный email или пароль')
    expect(feedback).not.toHaveTextContent('backend detail must stay private')
    expect(screen.getByRole('form')).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining(feedback.id)
    )
    expect(email).toHaveValue('wrong@example.test')
    expect(password).toHaveValue('')
    await waitFor(() => expect(password).toHaveFocus())
    const { toast } = await import('sonner')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('has no automated accessibility violations in the request-error state', async () => {
    const user = userEvent.setup()
    vi.mocked(api.loginUser).mockRejectedValue(new ApiError('synthetic service outage', 503))
    const { container } = renderForm('redirect=%2Forders')

    await fillValidCredentials(user)
    await user.click(screen.getByRole('button', { name: /войти/i }))
    await screen.findByRole('alert')

    expect(await axe(container)).toHaveNoViolations()
  })

  it('does not retry failed login submissions even when global mutation retries are enabled', async () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: 2, retryDelay: 1, gcTime: 0 },
      },
    })
    const user = userEvent.setup()
    const mockLoginUser = vi.mocked(api.loginUser)
    mockLoginUser.mockRejectedValue(new Error('rate limited'))

    renderForm()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/пароль/i), 'password123')
    await user.click(screen.getByRole('button', { name: /войти/i }))

    await waitFor(
      () => {
        expect(mockLoginUser).toHaveBeenCalledTimes(1)
      },
      { timeout: 5000 }
    )
  })

  it('shows distinct recoverable feedback and restores password focus after network failure', async () => {
    const user = userEvent.setup()
    const mockLoginUser = vi.mocked(api.loginUser)
    mockLoginUser.mockRejectedValue(new ApiError('connection refused', 0))
    renderForm()

    const email = screen.getByLabelText(/^email/i)
    const password = screen.getByLabelText(/^пароль/i)
    await user.type(email, 'user@example.test')
    await user.type(password, 'synthetic-password')
    await user.click(screen.getByRole('button', { name: /войти/i }))

    const feedback = await screen.findByRole('alert')
    expect(feedback).toHaveTextContent(/не удалось подключиться|сервис временно недоступен/i)
    expect(feedback).not.toHaveTextContent('Неверный email или пароль')
    expect(screen.getByRole('form')).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining(feedback.id)
    )
    expect(email).toHaveValue('user@example.test')
    expect(password).toHaveValue('')
    await waitFor(() => expect(password).toHaveFocus())
  })

  it('submits exactly one new request when the user deliberately retries after a network failure', async () => {
    const user = userEvent.setup()
    const mockLoginUser = vi.mocked(api.loginUser)
    mockLoginUser
      .mockRejectedValueOnce(new ApiError('initial synthetic service outage', 503))
      .mockRejectedValueOnce(new ApiError('retry synthetic service outage', 503))
    renderForm()

    const email = screen.getByLabelText(/^email/i)
    const password = screen.getByLabelText(/^пароль/i)
    await user.type(email, 'user@example.test')
    await user.type(password, 'initial-synthetic-password')
    await user.click(screen.getByRole('button', { name: /войти/i }))

    await screen.findByRole('alert')
    expect(email).toHaveValue('user@example.test')
    expect(password).toHaveValue('')
    await waitFor(() => expect(password).toHaveFocus())
    expect(mockLoginUser).toHaveBeenCalledTimes(1)

    await user.type(password, 'replacement-synthetic-password')
    expect(mockLoginUser).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: /войти/i }))

    await waitFor(() => expect(mockLoginUser).toHaveBeenCalledTimes(2))
    expect(mockLoginUser).toHaveBeenNthCalledWith(2, {
      email: 'user@example.test',
      password: 'replacement-synthetic-password',
    })
    expect(mockLoginUser).toHaveBeenCalledTimes(2)
    await waitFor(() => expect(password).toHaveValue(''))
    expect(email).toHaveValue('user@example.test')
    await waitFor(() => expect(password).toHaveFocus())
  })

  it('explains a valid redirect entry as re-authentication without protected content', () => {
    renderForm('redirect=%2Forders%3Fweek%3D2026-W32')

    expect(screen.getByText(/сессия истекла|войдите повторно/i)).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: /main navigation/i })).not.toBeInTheDocument()
    expect(screen.queryByTestId('app-shell')).not.toBeInTheDocument()
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
        expect(mockLogin).toHaveBeenCalledWith(mockUser, 'fake-token', 'cabinet-1')
      },
      { timeout: 5000 }
    )
  })

  it('stores null cabinet id when the successful user has no cabinets', async () => {
    const user = userEvent.setup()
    vi.mocked(api.loginUser).mockResolvedValue(validResponse())
    renderForm()

    await fillValidCredentials(user)
    await user.click(screen.getByRole('button', { name: /войти/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(validResponse().user, validResponse().token, null)
    })
  })

  it('navigates exactly once after the existing 100ms persistence delay', async () => {
    const nativeSetTimeout = globalThis.setTimeout
    let navigationTimer: (() => void) | undefined
    const timeoutSpy = vi
      .spyOn(globalThis, 'setTimeout')
      .mockImplementation((callback, delay, ...args) => {
        if (delay === 100) {
          navigationTimer = callback as () => void
          return 1 as unknown as ReturnType<typeof setTimeout>
        }

        return nativeSetTimeout(callback, delay, ...args)
      })
    vi.mocked(api.loginUser).mockResolvedValue(validResponse(['cabinet-1']))
    const { container } = renderForm()

    await act(async () => Promise.resolve())
    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: 'user@example.test' },
    })
    fireEvent.change(screen.getByLabelText(/^пароль/i), {
      target: { value: 'synthetic-password' },
    })
    fireEvent.submit(container.querySelector('form')!)
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(mockLogin).toHaveBeenCalledTimes(1)
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100)

    expect(navigationTimer).toBeTypeOf('function')
    act(() => navigationTimer!())
    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    timeoutSpy.mockRestore()
  })

  it('keeps success locked until navigation and ignores a repeated activation', async () => {
    const nativeSetTimeout = globalThis.setTimeout
    let navigationTimer: (() => void) | undefined
    const timeoutSpy = vi
      .spyOn(globalThis, 'setTimeout')
      .mockImplementation((callback, delay, ...args) => {
        if (delay === 100) {
          navigationTimer = callback as () => void
          return 1 as unknown as ReturnType<typeof setTimeout>
        }

        return nativeSetTimeout(callback, delay, ...args)
      })
    vi.mocked(api.loginUser).mockResolvedValue(validResponse(['cabinet-1']))
    const { container } = renderForm()

    await act(async () => Promise.resolve())
    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: 'user@example.test' },
    })
    fireEvent.change(screen.getByLabelText(/^пароль/i), {
      target: { value: 'synthetic-password' },
    })
    const formElement = container.querySelector('form')!
    fireEvent.submit(formElement)
    await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1))

    expect(screen.getByLabelText(/^email/i)).toBeDisabled()
    expect(screen.getByLabelText(/^пароль/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /вход.../i })).toBeDisabled()
    fireEvent.submit(formElement)

    expect(api.loginUser).toHaveBeenCalledTimes(1)
    expect(mockLogin).toHaveBeenCalledTimes(1)
    expect(timeoutSpy.mock.calls.filter(([, delay]) => delay === 100)).toHaveLength(1)
    expect(mockNavigate).not.toHaveBeenCalled()

    act(() => navigationTimer!())
    expect(mockNavigate).toHaveBeenCalledTimes(1)
    timeoutSpy.mockRestore()
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

    renderForm()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/пароль/i), 'password123')
    await user.click(screen.getByRole('button', { name: /войти/i }))

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      },
      { timeout: 5000 }
    )
  })

  it('preserves a same-origin absolute-path redirect with query and fragment', async () => {
    const user = userEvent.setup()
    vi.mocked(api.loginUser).mockResolvedValue(validResponse())
    renderForm('redirect=%2Forders%3Fweek%3D2026-W32%23row-1')

    await fillValidCredentials(user)
    await user.click(screen.getByRole('button', { name: /войти/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/orders?week=2026-W32#row-1')
    })
  })

  it('preserves a valid decoded same-origin redirect containing a literal percent', async () => {
    const user = userEvent.setup()
    const redirect = '/orders?q=50%'
    vi.mocked(api.loginUser).mockResolvedValue(validResponse())
    renderForm(`redirect=${encodeURIComponent(redirect)}`)

    await fillValidCredentials(user)
    await user.click(screen.getByRole('button', { name: /войти/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(redirect))
  })

  it.each([
    ['truncated UTF-8 escape', 'redirect=%2Forders%3Fq%3D%E0%A4%A'],
    ['non-hex escape', 'redirect=%2Forders%3Fq%3D%GG'],
  ])(
    'falls back to dashboard for a same-origin path with a raw malformed outer %s',
    async (_case, rawSearch) => {
      const user = userEvent.setup()
      vi.mocked(api.loginUser).mockResolvedValue(validResponse())
      renderForm(rawSearch)

      await fillValidCredentials(user)
      await user.click(screen.getByRole('button', { name: /войти/i }))

      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'))
      expect(mockNavigate).toHaveBeenCalledTimes(1)
    }
  )

  it.each([
    ['/orders?q=книга', '/orders?q=книга'],
    ['/orders?q=a b', '/orders?q=a b'],
    ['/orders#раздел', '/orders#раздел'],
    ['/orders?next=%2Fanalytics%2Forders', '/orders?next=%2Fanalytics%2Forders'],
  ])('preserves the valid localized redirect %s', async (redirect, expected) => {
    const user = userEvent.setup()
    vi.mocked(api.loginUser).mockResolvedValue(validResponse())
    renderForm(`redirect=${encodeURIComponent(redirect)}`)

    await fillValidCredentials(user)
    await user.click(screen.getByRole('button', { name: /войти/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(expected))
  })

  it.each([
    ['external URL', 'https://evil.example/phish'],
    ['protocol-relative URL', '//evil.example/phish'],
    ['backslash path', '\\evil.example\\phish'],
    ['script protocol', 'javascript:alert(1)'],
    ['malformed URL encoding', '%E0%A4%A'],
  ])('falls back to dashboard for an unsafe %s redirect', async (_case, redirect) => {
    const user = userEvent.setup()
    vi.mocked(api.loginUser).mockResolvedValue(validResponse())
    renderForm(`redirect=${encodeURIComponent(redirect)}`)

    await fillValidCredentials(user)
    await user.click(screen.getByRole('button', { name: /войти/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'))
    expect(mockNavigate).toHaveBeenCalledTimes(1)
  })

  it('associates invalid field feedback with its input', async () => {
    const user = userEvent.setup()
    renderForm()

    const email = screen.getByLabelText(/^email/i)
    await user.type(email, 'invalid-email')
    await user.tab()

    const feedback = await screen.findByText('Неверный формат email')
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveAttribute('aria-describedby', expect.stringContaining(feedback.id))
  })

  it('submits once with Enter from the password field', async () => {
    const user = userEvent.setup()
    vi.mocked(api.loginUser).mockResolvedValue(validResponse())
    renderForm()

    await user.type(screen.getByLabelText(/^email/i), 'user@example.test')
    const password = screen.getByLabelText(/^пароль/i)
    await user.type(password, 'synthetic-password')
    await user.keyboard('{Enter}')

    await waitFor(() => expect(api.loginUser).toHaveBeenCalledTimes(1))
  })

  it('retains the explicit retry false source lock', () => {
    const source = readFileSync('src/components/custom/LoginForm.tsx', 'utf8')

    expect(source).toMatch(/useMutation\s*\(\s*\{[\s\S]*?retry:\s*false/)
  })
})
