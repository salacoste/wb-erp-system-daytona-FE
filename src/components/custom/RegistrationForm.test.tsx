import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { axe, toHaveNoViolations } from 'jest-axe'
import { renderToStaticMarkup } from 'react-dom/server'
import { RegistrationForm } from './RegistrationForm'
import * as api from '@/lib/api'
import type { RegisterResponse } from '@/types/auth'
import { ApiError } from '@/types/api'

expect.extend(toHaveNoViolations)

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
}))

const authStoreMocks = vi.hoisted(() => ({
  login: vi.fn(),
  setState: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  registerUser: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: navigationMocks.push,
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/stores/authStore', () => {
  const state = { login: authStoreMocks.login }
  const useAuthStore = Object.assign(
    vi.fn((selector?: (value: typeof state) => unknown) => (selector ? selector(state) : state)),
    {
      getState: vi.fn(() => state),
      setState: authStoreMocks.setState,
    }
  )

  return { useAuthStore }
})

describe('RegistrationForm', () => {
  let queryClient: QueryClient

  const validResponse: RegisterResponse = {
    user: {
      id: 'synthetic-user',
      email: 'seller@example.test',
      role: 'Owner',
    },
  }

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
    vi.restoreAllMocks()
  })

  const renderForm = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <RegistrationForm />
      </QueryClientProvider>
    )

  const fillValidCredentials = async (
    user: ReturnType<typeof userEvent.setup>,
    email = 'seller@example.test',
    password = 'synthetic-password'
  ) => {
    await user.type(screen.getByLabelText(/^email/i), email)
    await user.type(screen.getByLabelText(/^пароль/i), password)
  }

  it('[REG-FORM-01] preserves visible labels, types, autocomplete, and masked password semantics', () => {
    renderForm()

    const email = screen.getByLabelText(/^email/i)
    const password = screen.getByLabelText(/^пароль/i)
    const submit = screen.getByRole('button', { name: 'Зарегистрироваться' })

    expect(email).toHaveAttribute('type', 'email')
    expect(email).toHaveAttribute('autocomplete', 'email')
    expect(email).toHaveAttribute('aria-required', 'true')
    expect(password).toHaveAttribute('type', 'password')
    expect(password).toHaveAttribute('autocomplete', 'new-password')
    expect(password).toHaveAttribute('aria-required', 'true')
    expect(submit).toHaveAttribute('type', 'submit')
  })

  it('[Review 1 finding 1] locks named credential controls before hydration without announcing request activity', async () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <RegistrationForm />
      </QueryClientProvider>
    )
    const document = new DOMParser().parseFromString(html, 'text/html')
    const form = document.querySelector('form')!
    const email = form.elements.namedItem('email') as HTMLInputElement
    const password = form.elements.namedItem('password') as HTMLInputElement
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!

    expect(email.hasAttribute('disabled')).toBe(true)
    expect(password.hasAttribute('disabled')).toBe(true)
    expect(submit.hasAttribute('disabled')).toBe(true)
    expect(Array.from(new FormData(form).keys())).toEqual([])
    expect(form.hasAttribute('method')).toBe(false)
    expect(form.hasAttribute('action')).toBe(false)
    expect(submit.getAttribute('aria-busy')).toBe('false')
    expect(submit.textContent).toBe('Зарегистрироваться')
    expect(api.registerUser).not.toHaveBeenCalled()

    renderForm()

    await waitFor(() => {
      expect(screen.getByLabelText(/^email/i)).toBeEnabled()
      expect(screen.getByLabelText(/^пароль/i)).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Зарегистрироваться' })).toBeEnabled()
    })
  })

  it('[REG-FORM-01] provides Story-local 44px minimum primary controls', () => {
    renderForm()

    expect(screen.getByLabelText(/^email/i)).toHaveClass('min-h-11', 'border-foreground/50')
    expect(screen.getByLabelText(/^пароль/i)).toHaveClass('min-h-11', 'border-foreground/50')
    expect(screen.getByRole('button', { name: 'Зарегистрироваться' })).toHaveClass('min-h-11')
  })

  it('[REG-FORM-01] is axe-clean in the default state', async () => {
    const { container } = renderForm()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('[REG-FORM-01] associates empty-field errors, exposes a focusable summary, focuses email, and sends no request', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    const email = screen.getByLabelText(/^email/i)
    const password = screen.getByLabelText(/^пароль/i)
    expect(await screen.findByText('Email обязателен')).toBeInTheDocument()
    expect(screen.getByText('Пароль обязателен')).toBeInTheDocument()
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(password).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveAccessibleDescription('Email обязателен')
    expect(password).toHaveAccessibleDescription('Пароль обязателен')
    expect(email).toHaveFocus()
    expect(api.registerUser).not.toHaveBeenCalled()

    const summary = screen.getByRole('alert', {
      name: /исправьте ошибки в форме/i,
    })
    expect(summary).toHaveAttribute('tabindex', '-1')
  })

  it('[Review 2 finding 3] removes the multi-error summary and form association as both live errors are corrected', async () => {
    const user = userEvent.setup()
    renderForm()

    const form = screen.getByRole('form')
    const email = screen.getByLabelText(/^email/i)
    const password = screen.getByLabelText(/^пароль/i)
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    const summary = screen.getByRole('alert', {
      name: /исправьте ошибки в форме/i,
    })
    expect(form).toHaveAttribute('aria-describedby', expect.stringContaining(summary.id))

    await user.type(email, 'corrected@example.test')
    await user.type(password, 'synthetic-password')

    await waitFor(() => {
      expect(screen.queryByText('Email обязателен')).not.toBeInTheDocument()
      expect(screen.queryByText('Пароль обязателен')).not.toBeInTheDocument()
      expect(
        screen.queryByRole('alert', { name: /исправьте ошибки в форме/i })
      ).not.toBeInTheDocument()
    })
    expect(form).not.toHaveAttribute('aria-describedby')
    expect(api.registerUser).not.toHaveBeenCalled()
  })

  it.each([
    {
      label: 'malformed email',
      email: 'invalid-email',
      password: 'synthetic-password',
      message: 'Неверный формат email',
    },
    {
      label: 'seven-character password',
      email: 'seller@example.test',
      password: '1234567',
      message: 'Пароль должен содержать минимум 8 символов',
    },
  ])(
    '[REG-FORM-01] blocks $label with associated feedback and zero requests',
    async ({ email, password, message }) => {
      const user = userEvent.setup()
      renderForm()

      await user.type(screen.getByLabelText(/^email/i), email)
      await user.type(screen.getByLabelText(/^пароль/i), password)
      await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

      const feedback = await screen.findByText(message)
      const invalidControl = message.startsWith('Неверный')
        ? screen.getByLabelText(/^email/i)
        : screen.getByLabelText(/^пароль/i)
      expect(invalidControl).toHaveAttribute('aria-invalid', 'true')
      expect(invalidControl).toHaveAccessibleDescription(message)
      expect(feedback).toBeVisible()
      expect(api.registerUser).not.toHaveBeenCalled()
    }
  )

  it('[REG-FORM-02] makes registerUser the sole request with the exact email/password payload', async () => {
    const user = userEvent.setup()
    vi.mocked(api.registerUser).mockResolvedValue(validResponse)
    renderForm()

    await fillValidCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    await waitFor(() => expect(api.registerUser).toHaveBeenCalledTimes(1))
    expect(api.registerUser).toHaveBeenCalledWith({
      email: 'seller@example.test',
      password: 'synthetic-password',
    })
  })

  it('[REG-FORM-03] disables every primary control with truthful pending semantics', async () => {
    const user = userEvent.setup()
    let resolveRequest!: (value: RegisterResponse) => void
    vi.mocked(api.registerUser).mockReturnValue(
      new Promise<RegisterResponse>(resolve => {
        resolveRequest = resolve
      })
    )
    renderForm()

    await fillValidCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    await waitFor(() => {
      expect(screen.getByLabelText(/^email/i)).toBeDisabled()
      expect(screen.getByLabelText(/^пароль/i)).toBeDisabled()
      const submit = screen.getByRole('button', { name: 'Регистрация...' })
      expect(submit).toBeDisabled()
      expect(submit).toHaveAttribute('aria-busy', 'true')
    })
    resolveRequest(validResponse)
  })

  it('[REG-FORM-03] keeps one request during repeated Enter activation while pending', async () => {
    const user = userEvent.setup()
    let resolveRequest!: (value: RegisterResponse) => void
    vi.mocked(api.registerUser).mockReturnValue(
      new Promise<RegisterResponse>(resolve => {
        resolveRequest = resolve
      })
    )
    renderForm()

    await fillValidCredentials(user)
    const password = screen.getByLabelText(/^пароль/i)
    expect(password).toHaveFocus()
    expect(password).toBeEnabled()
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(api.registerUser).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('button', { name: 'Регистрация...' })).toBeDisabled()
    })

    await user.keyboard('{Enter}')
    expect(api.registerUser).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: /повторить/i })).not.toBeInTheDocument()
    resolveRequest(validResponse)
  })

  it('[Story 167.4 RED] synchronously locks duplicate valid submits before a pending render commits', async () => {
    let resolveRequest!: (value: RegisterResponse) => void
    vi.mocked(api.registerUser).mockReturnValue(
      new Promise<RegisterResponse>(resolve => {
        resolveRequest = resolve
      })
    )
    const { container } = renderForm()

    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: 'seller@example.test' },
    })
    fireEvent.change(screen.getByLabelText(/^пароль/i), {
      target: { value: 'synthetic-password' },
    })
    const form = container.querySelector('form')!
    fireEvent.submit(form)
    fireEvent.submit(form)

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Регистрация...' })).toBeDisabled()
    )
    expect(api.registerUser).toHaveBeenCalledTimes(1)
    resolveRequest(validResponse)
  })

  it('[REG-FORM-04] classifies ApiError status 409 as duplicate without trusting hostile detail', async () => {
    const user = userEvent.setup()
    vi.mocked(api.registerUser).mockRejectedValue(
      new ApiError('HOSTILE_UNRELATED_DETAIL seller@example.test trace-409', 409, {
        password: 'must-not-render',
      })
    )
    const { toast } = await import('sonner')
    renderForm()

    await fillValidCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
    expect(toast.error).toHaveBeenCalledWith('Этот email уже зарегистрирован. Пожалуйста, войдите.')
    expect(screen.queryByText(/HOSTILE_UNRELATED_DETAIL/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/must-not-render/i)).not.toBeInTheDocument()
  })

  it('[REG-FORM-04] retains masked credentials and exposes associated duplicate recovery with focus and a login link', async () => {
    const user = userEvent.setup()
    vi.mocked(api.registerUser).mockRejectedValue(
      new ApiError('duplicate raw backend detail must stay private', 409)
    )
    renderForm()

    const email = screen.getByLabelText(/^email/i)
    const password = screen.getByLabelText(/^пароль/i)
    await fillValidCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))
    await waitFor(() => expect(api.registerUser).toHaveBeenCalledTimes(1))

    expect(email).toHaveValue('seller@example.test')
    expect(password).toHaveValue('synthetic-password')
    expect(password).toHaveAttribute('type', 'password')
    expect(screen.queryByText(/duplicate raw backend detail/i)).not.toBeInTheDocument()

    const feedback = screen.getByRole('alert')
    expect(feedback).toHaveTextContent(/этот email уже зарегистрирован/i)
    expect(feedback).toHaveFocus()
    expect(
      `${email.getAttribute('aria-describedby') ?? ''} ${
        screen.getByRole('form').getAttribute('aria-describedby') ?? ''
      }`
    ).toContain(feedback.id)
    expect(within(feedback).getByRole('link', { name: /войти/i })).toHaveAttribute('href', '/login')
  })

  it('[Review 1 findings 3 and 4] clears stale duplicate feedback on email correction and submits once more with the retained password', async () => {
    const user = userEvent.setup()
    vi.mocked(api.registerUser).mockRejectedValueOnce(
      new ApiError('duplicate detail must stay private', 409)
    )
    renderForm()

    const email = screen.getByLabelText(/^email/i)
    const password = screen.getByLabelText(/^пароль/i)
    await fillValidCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    const duplicateFeedback = await screen.findByRole('alert')
    expect(duplicateFeedback).toHaveTextContent(/этот email уже зарегистрирован/i)
    expect(api.registerUser).toHaveBeenCalledTimes(1)
    expect(password).toHaveValue('synthetic-password')
    expect(password).toHaveAttribute('type', 'password')

    await user.clear(email)
    await user.type(email, 'corrected@example.test')

    expect(screen.queryByText(/этот email уже зарегистрирован/i)).not.toBeInTheDocument()
    expect(password).toHaveValue('synthetic-password')
    expect(password).toHaveAttribute('type', 'password')

    vi.mocked(api.registerUser).mockResolvedValueOnce(validResponse)
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    await waitFor(() => expect(api.registerUser).toHaveBeenCalledTimes(2))
    expect(api.registerUser).toHaveBeenNthCalledWith(2, {
      email: 'corrected@example.test',
      password: 'synthetic-password',
    })
    expect(screen.queryByText(/этот email уже зарегистрирован/i)).not.toBeInTheDocument()
    await waitFor(() => expect(navigationMocks.push).toHaveBeenCalledTimes(1))
    expect(navigationMocks.push).toHaveBeenCalledWith('/login')
    expect(api.registerUser).toHaveBeenCalledTimes(2)
  })

  it.each([0, 503])(
    '[REG-FORM-05] classifies ApiError status %i as safe associated service recovery',
    async status => {
      const user = userEvent.setup()
      vi.mocked(api.registerUser).mockRejectedValue(
        new ApiError(`HOSTILE_STATUS_${status} seller@example.test`, status, {
          stack: 'raw-stack-must-not-render',
        })
      )
      renderForm()

      const email = screen.getByLabelText(/^email/i)
      const password = screen.getByLabelText(/^пароль/i)
      await fillValidCredentials(user)
      await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))
      await waitFor(() => expect(api.registerUser).toHaveBeenCalledTimes(1))

      expect(email).toHaveValue('seller@example.test')
      expect(password).toHaveValue('synthetic-password')
      expect(password).toHaveAttribute('type', 'password')
      expect(screen.queryByText(new RegExp(`HOSTILE_STATUS_${status}`))).not.toBeInTheDocument()
      expect(screen.queryByText(/raw-stack-must-not-render/i)).not.toBeInTheDocument()

      const feedback = screen.getByRole('alert')
      expect(feedback).toHaveTextContent(
        /не удалось зарегистрироваться|сервис временно недоступен|попробуйте еще раз/i
      )
      expect(feedback).toHaveFocus()
      expect(screen.getByRole('form')).toHaveAttribute(
        'aria-describedby',
        expect.stringContaining(feedback.id)
      )
      expect(screen.getByRole('button', { name: /повторить/i })).toHaveClass('min-h-11', 'min-w-11')
    }
  )

  it('[Review 3 finding M-1] keeps password-like hostile 5xx detail in generic service recovery', async () => {
    const user = userEvent.setup()
    vi.mocked(api.registerUser).mockRejectedValue(
      new ApiError('password hashing service unavailable raw-detail', 500)
    )
    renderForm()

    const form = screen.getByRole('form')
    const email = screen.getByLabelText(/^email/i)
    const password = screen.getByLabelText(/^пароль/i)
    await fillValidCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))
    await waitFor(() => expect(api.registerUser).toHaveBeenCalledTimes(1))

    expect(email).toHaveValue('seller@example.test')
    expect(password).toHaveValue('synthetic-password')
    expect(password).toHaveAttribute('type', 'password')
    expect(screen.queryByText(/password hashing service unavailable/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/raw-detail/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Пароль не соответствует требованиям.')).not.toBeInTheDocument()

    const feedback = screen.getByRole('alert')
    expect(feedback).toHaveTextContent('Сервис временно недоступен. Попробуйте еще раз.')
    expect(feedback).toHaveFocus()
    expect(form).toHaveAttribute('aria-describedby', expect.stringContaining(feedback.id))
    expect(within(feedback).getByRole('button', { name: 'Повторить' })).toBeInTheDocument()
  })

  it('[Frozen review finding 1] restores safe associated password-policy recovery and clears it on password edit', async () => {
    const user = userEvent.setup()
    vi.mocked(api.registerUser).mockRejectedValue(
      new ApiError('PASSWORD_POLICY_REJECTED raw-password-detail', 422, {
        detail: 'пароль raw-policy-payload must-not-render',
      })
    )
    renderForm()

    const form = screen.getByRole('form')
    const email = screen.getByLabelText(/^email/i)
    const password = screen.getByLabelText(/^пароль/i)
    await fillValidCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))
    await waitFor(() => expect(api.registerUser).toHaveBeenCalledTimes(1))

    expect(email).toHaveValue('seller@example.test')
    expect(password).toHaveValue('synthetic-password')
    expect(password).toHaveAttribute('type', 'password')
    const feedback = screen.getByRole('alert')
    expect(feedback).toHaveTextContent('Пароль не соответствует требованиям.')
    expect(feedback).not.toHaveTextContent(/сервис временно недоступен/i)
    expect(screen.queryByText(/PASSWORD_POLICY_REJECTED/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/raw-password-detail/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/raw-policy-payload/i)).not.toBeInTheDocument()
    expect(feedback).toHaveFocus()
    expect(
      `${password.getAttribute('aria-describedby') ?? ''} ${
        form.getAttribute('aria-describedby') ?? ''
      }`
    ).toContain(feedback.id)

    await user.type(password, '!')

    await waitFor(() =>
      expect(screen.queryByText('Пароль не соответствует требованиям.')).not.toBeInTheDocument()
    )
    expect(form.getAttribute('aria-describedby') ?? '').not.toContain(feedback.id)
    expect(password.getAttribute('aria-describedby') ?? '').not.toContain(feedback.id)
    expect(api.registerUser).toHaveBeenCalledTimes(1)
  })

  it('[Review 2 finding 1] validates every edited recovery attempt before one corrected exact retry', async () => {
    const user = userEvent.setup()
    vi.mocked(api.registerUser)
      .mockRejectedValueOnce(new ApiError('first hostile service detail', 503))
      .mockResolvedValueOnce(validResponse)
    renderForm()

    const form = screen.getByRole('form')
    const email = screen.getByLabelText(/^email/i)
    const password = screen.getByLabelText(/^пароль/i)
    await fillValidCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
    const retry = screen.getByRole('button', { name: /повторить/i })
    expect(api.registerUser).toHaveBeenCalledTimes(1)

    await user.clear(email)
    await user.clear(password)
    await user.click(retry)

    expect(api.registerUser).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Email обязателен')).toBeInTheDocument()
    expect(screen.getByText('Пароль обязателен')).toBeInTheDocument()
    expect(email).toHaveAccessibleDescription('Email обязателен')
    expect(password).toHaveAccessibleDescription('Пароль обязателен')
    expect(email).toHaveFocus()

    await user.type(email, 'invalid-email')
    await user.type(password, '1234567')
    await user.click(retry)

    expect(api.registerUser).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Неверный формат email')).toBeInTheDocument()
    expect(screen.getByText('Пароль должен содержать минимум 8 символов')).toBeInTheDocument()
    expect(email).toHaveAccessibleDescription('Неверный формат email')
    expect(password).toHaveAccessibleDescription('Пароль должен содержать минимум 8 символов')
    expect(email).toHaveFocus()

    const summary = screen.getByRole('alert', { name: /исправьте ошибки в форме/i })
    expect(form).toHaveAttribute('aria-describedby', expect.stringContaining(summary.id))

    await user.clear(email)
    await user.type(email, 'corrected@example.test')
    await user.clear(password)
    await user.type(password, 'corrected-password')

    await waitFor(() => {
      expect(screen.queryByText('Неверный формат email')).not.toBeInTheDocument()
      expect(
        screen.queryByText('Пароль должен содержать минимум 8 символов')
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('alert', { name: /исправьте ошибки в форме/i })
      ).not.toBeInTheDocument()
    })
    expect(form.getAttribute('aria-describedby')).not.toContain(summary.id)
    expect(api.registerUser).toHaveBeenCalledTimes(1)

    await user.click(retry)

    await waitFor(() => expect(api.registerUser).toHaveBeenCalledTimes(2))
    expect(api.registerUser).toHaveBeenNthCalledWith(2, {
      email: 'corrected@example.test',
      password: 'corrected-password',
    })
    expect(api.registerUser).toHaveBeenCalledTimes(2)
    await waitFor(() => expect(navigationMocks.push).toHaveBeenCalledTimes(1))
    expect(navigationMocks.push).toHaveBeenCalledWith('/login')
  })

  it('[REG-FORM-05] disables automatic mutation retry even when the QueryClient enables it', async () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: 2, retryDelay: 1, gcTime: 0 },
      },
    })
    const user = userEvent.setup()
    vi.mocked(api.registerUser).mockRejectedValue(
      new ApiError('hostile automatic retry detail', 503)
    )
    const { toast } = await import('sonner')
    renderForm()

    await fillValidCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
    expect(api.registerUser).toHaveBeenCalledTimes(1)
  })

  it('[REG-FORM-05] keeps associated service feedback axe-clean', async () => {
    const user = userEvent.setup()
    vi.mocked(api.registerUser).mockRejectedValue(new ApiError('hostile accessibility detail', 503))
    const { container } = renderForm()

    await fillValidCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))
    const { toast } = await import('sonner')
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('[REG-FORM-06] preserves success toast, exactly one login navigation, and no auth/session write', async () => {
    const user = userEvent.setup()
    vi.mocked(api.registerUser).mockResolvedValue(validResponse)
    const storageWrite = vi.spyOn(Storage.prototype, 'setItem')
    const { toast } = await import('sonner')
    renderForm()

    await fillValidCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    await waitFor(() => expect(navigationMocks.push).toHaveBeenCalledTimes(1))
    expect(navigationMocks.push).toHaveBeenCalledWith('/login')
    expect(toast.success).toHaveBeenCalledTimes(1)
    expect(toast.success).toHaveBeenCalledWith('Регистрация успешна! Пожалуйста, войдите.')
    expect(authStoreMocks.login).not.toHaveBeenCalled()
    expect(authStoreMocks.setState).not.toHaveBeenCalled()
    expect(storageWrite).not.toHaveBeenCalled()
  })

  it('[REG-FORM-06] keeps a terminal success lock and ignores repeated activation after resolution', async () => {
    vi.mocked(api.registerUser).mockResolvedValue(validResponse)
    const { container } = renderForm()

    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: 'seller@example.test' },
    })
    fireEvent.change(screen.getByLabelText(/^пароль/i), {
      target: { value: 'synthetic-password' },
    })
    const form = container.querySelector('form')!
    fireEvent.submit(form)
    await waitFor(() => expect(navigationMocks.push).toHaveBeenCalledTimes(1))

    expect(screen.getByLabelText(/^email/i)).toBeDisabled()
    expect(screen.getByLabelText(/^пароль/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /регистрация/i })).toBeDisabled()
    fireEvent.submit(form)

    await waitFor(() => expect(api.registerUser).toHaveBeenCalledTimes(1))
    expect(navigationMocks.push).toHaveBeenCalledTimes(1)
  })
})
