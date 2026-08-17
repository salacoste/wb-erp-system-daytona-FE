import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WbTokenForm } from './WbTokenForm'
import { updateWbToken } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('@/lib/api', () => ({
  updateWbToken: vi.fn(),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('WbTokenForm', () => {
  let queryClient: QueryClient
  const mockPush = vi.fn()
  const validToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false, gcTime: 0 },
      },
    })
    vi.clearAllMocks()
    ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    })
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      token: 'jwt-token',
      cabinetId: 'cabinet-uuid',
      user: { id: 'manager-1', email: 'manager@test.local', role: 'Manager' },
    })
  })

  afterEach(() => {
    cleanup()
    queryClient.clear()
  })

  const renderForm = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <WbTokenForm />
      </QueryClientProvider>
    )
  }

  it('renders WB token form with token field', { timeout: 5000 }, () => {
    renderForm()

    expect(screen.getByLabelText(/wb api токен/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /сохранить токен/i })).toBeInTheDocument()
  })

  it('validates token minimum length', { timeout: 5000 }, async () => {
    const user = userEvent.setup()
    renderForm()

    const tokenInput = screen.getByLabelText(/wb api токен/i)
    await user.type(tokenInput, 'short')
    await user.tab()

    await waitFor(
      () => {
        expect(screen.getByText(/слишком коротким/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('validates token format (JWT structure)', { timeout: 10000 }, async () => {
    const user = userEvent.setup()
    renderForm()

    const tokenInput = screen.getByLabelText(/wb api токен/i)
    // Type a long token that doesn't have JWT structure (3 parts)
    await user.type(
      tokenInput,
      'invalid-token-format-without-proper-jwt-structure-that-is-long-enough'
    )
    await user.tab()

    await waitFor(
      () => {
        const errorText = screen.queryByText(/формат токена/i)
        if (!errorText) {
          // Try alternative error message
          expect(screen.getByText(/неверным/i) || screen.getByText(/формат/i)).toBeInTheDocument()
        } else {
          expect(errorText).toBeInTheDocument()
        }
      },
      { timeout: 5000 }
    )
  })

  it('keeps token save disabled for analyst users', { timeout: 5000 }, () => {
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      token: 'jwt-token',
      cabinetId: 'cabinet-uuid',
      user: { id: 'analyst-1', email: 'analyst@test.local', role: 'Analyst' },
    })

    renderForm()

    expect(screen.getByRole('button', { name: /сохранить токен/i })).toBeDisabled()
  })

  it('keeps token save disabled when role is missing', { timeout: 5000 }, () => {
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      token: 'jwt-token',
      cabinetId: 'cabinet-uuid',
      user: null,
    })

    renderForm()

    expect(screen.getByRole('button', { name: /сохранить токен/i })).toBeDisabled()
  })

  it('calls updateWbToken on valid form submission', { timeout: 10000 }, async () => {
    const user = userEvent.setup()
    const mockUpdateWbToken = vi.mocked(updateWbToken)
    mockUpdateWbToken.mockResolvedValue({
      id: 'key-id',
      keyName: 'wb_api_token',
      updatedAt: '2025-01-12T10:00:00Z',
    })

    renderForm()

    const tokenInput = screen.getByLabelText(/wb api токен/i)
    await user.clear(tokenInput)
    await user.type(tokenInput, validToken)

    await new Promise(resolve => setTimeout(resolve, 100))

    const submitButton = screen.getByRole('button', { name: /сохранить токен/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(mockUpdateWbToken).toHaveBeenCalledWith('cabinet-uuid', 'wb_api_token', validToken)
      },
      { timeout: 5000 }
    )
  })

  it('shows loading state during submission', { timeout: 10000 }, async () => {
    const user = userEvent.setup()
    const mockUpdateWbToken = vi.mocked(updateWbToken)
    let resolvePromise: (value: Record<string, unknown>) => void
    const promise = new Promise<Record<string, unknown>>(resolve => {
      resolvePromise = resolve
    })
    mockUpdateWbToken.mockReturnValue(promise as unknown as ReturnType<typeof updateWbToken>)

    renderForm()

    const tokenInput = screen.getByLabelText(/wb api токен/i)
    await user.clear(tokenInput)
    await user.type(tokenInput, validToken)

    await new Promise(resolve => setTimeout(resolve, 100))

    const submitButton = screen.getByRole('button', { name: /сохранить токен/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /проверка токена/i })).toBeInTheDocument()
        expect(screen.getByRole('button')).toBeDisabled()
      },
      { timeout: 3000 }
    )

    resolvePromise!({
      id: 'key-id',
      keyName: 'wb_api_token',
      updatedAt: '2025-01-12T10:00:00Z',
    })

    await waitFor(
      () => {
        expect(mockUpdateWbToken).toHaveBeenCalled()
      },
      { timeout: 3000 }
    )
  })

  it('handles token save errors', { timeout: 10000 }, async () => {
    const user = userEvent.setup()
    const mockUpdateWbToken = vi.mocked(updateWbToken)
    mockUpdateWbToken.mockRejectedValue(new Error('Invalid token'))

    renderForm()

    const tokenInput = screen.getByLabelText(/wb api токен/i)
    await user.clear(tokenInput)
    await user.type(tokenInput, validToken)

    await new Promise(resolve => setTimeout(resolve, 100))

    const submitButton = screen.getByRole('button', { name: /сохранить токен/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(toast.error).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )
  })

  it('navigates to processing page on success', { timeout: 10000 }, async () => {
    const user = userEvent.setup()
    const mockUpdateWbToken = vi.mocked(updateWbToken)
    mockUpdateWbToken.mockResolvedValue({
      id: 'key-id',
      keyName: 'wb_api_token',
      updatedAt: '2025-01-12T10:00:00Z',
    })

    renderForm()

    const tokenInput = screen.getByLabelText(/wb api токен/i)
    await user.clear(tokenInput)
    await user.type(tokenInput, validToken)

    await new Promise(resolve => setTimeout(resolve, 100))

    const submitButton = screen.getByRole('button', { name: /сохранить токен/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(mockUpdateWbToken).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )

    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith('/processing')
        expect(toast.success).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )
  })

  it('shows error message when cabinetId is missing', { timeout: 5000 }, () => {
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      token: 'jwt-token',
      cabinetId: null,
      user: { id: 'manager-1', email: 'manager@test.local', role: 'Manager' },
    })

    renderForm()

    expect(screen.getByText(/кабинет не найден/i)).toBeInTheDocument()
  })

  it('masks token input (password type)', { timeout: 5000 }, () => {
    renderForm()

    const tokenInput = screen.getByLabelText(/wb api токен/i)
    expect(tokenInput).toHaveAttribute('type', 'password')
  })

  // --- Story 167.7 behavior-lock additions ---

  it(
    'never leaks the token value into rendered output on error (masked input, no echo)',
    { timeout: 10000 },
    async () => {
      const user = userEvent.setup()
      const mockUpdateWbToken = vi.mocked(updateWbToken)
      mockUpdateWbToken.mockRejectedValue(new Error('Invalid token'))

      renderForm()

      const tokenInput = screen.getByLabelText(/wb api токен/i)
      await user.clear(tokenInput)
      await user.type(tokenInput, validToken)
      await user.click(screen.getByRole('button', { name: /сохранить токен/i }))

      await waitFor(
        () => {
          expect(screen.getByText('Токен недействителен')).toBeInTheDocument()
        },
        { timeout: 5000 }
      )

      // Privacy scan: the token must not appear in any rendered text or toast payload
      expect(document.body.textContent).not.toContain(validToken)
      for (const call of vi.mocked(toast.error).mock.calls) {
        expect(call.join(' ')).not.toContain(validToken)
      }
      expect(vi.mocked(toast.error).mock.calls[0]?.[0]).toBe('Токен недействителен')
    }
  )

  it(
    'never leaks the token value after success: form resets before navigation',
    { timeout: 10000 },
    async () => {
      const user = userEvent.setup()
      const mockUpdateWbToken = vi.mocked(updateWbToken)
      mockUpdateWbToken.mockResolvedValue({
        id: 'key-id',
        keyName: 'wb_api_token',
        updatedAt: '2026-08-17T10:00:00Z',
      })

      renderForm()

      const tokenInput = screen.getByLabelText(/wb api токен/i)
      await user.clear(tokenInput)
      await user.type(tokenInput, validToken)
      await user.click(screen.getByRole('button', { name: /сохранить токен/i }))

      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith('/processing')
        },
        { timeout: 5000 }
      )
      expect((tokenInput as HTMLInputElement).value).toBe('')
      expect(document.body.textContent).not.toContain(validToken)
    }
  )

  it(
    'prevents duplicate submissions while pending (single storage call)',
    { timeout: 10000 },
    async () => {
      const user = userEvent.setup()
      const mockUpdateWbToken = vi.mocked(updateWbToken)
      let resolvePromise: (value: Record<string, unknown>) => void
      mockUpdateWbToken.mockReturnValue(
        new Promise<Record<string, unknown>>(resolve => {
          resolvePromise = resolve
        }) as unknown as ReturnType<typeof updateWbToken>
      )

      renderForm()

      const tokenInput = screen.getByLabelText(/wb api токен/i)
      await user.clear(tokenInput)
      await user.type(tokenInput, validToken)
      const submitButton = screen.getByRole('button', { name: /сохранить токен/i })
      await user.click(submitButton)

      // Pending state disables the CTA and input: repeated Enter/clicks cannot re-submit
      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: /проверка токена/i })).toBeDisabled()
          expect(tokenInput).toBeDisabled()
        },
        { timeout: 3000 }
      )
      await user.click(screen.getByRole('button', { name: /проверка токена/i }))
      await user.keyboard('{Enter}')

      expect(mockUpdateWbToken).toHaveBeenCalledTimes(1)

      resolvePromise!({
        id: 'key-id',
        keyName: 'wb_api_token',
        updatedAt: '2026-08-17T10:00:00Z',
      })
      await waitFor(() => expect(mockUpdateWbToken).toHaveBeenCalledTimes(1), { timeout: 3000 })
    }
  )

  it.each([
    ['permission', new Error('Forbidden: permission denied'), 'Нет доступа'],
    ['network', new Error('Network connection refused'), 'Ошибка сети'],
    ['cabinet-missing-at-submit', new Error('Cabinet not found'), 'Кабинет не найден'],
    ['expired-session', new Error('User not authenticated'), 'Ошибка сохранения токена'],
  ])(
    'surfaces the locked copy for the %s state',
    { timeout: 10000 },
    async (_case, rejection, expectedTitle) => {
      const user = userEvent.setup()
      const mockUpdateWbToken = vi.mocked(updateWbToken)
      mockUpdateWbToken.mockRejectedValue(rejection as Error)

      renderForm()

      const tokenInput = screen.getByLabelText(/wb api токен/i)
      await user.clear(tokenInput)
      await user.type(tokenInput, validToken)
      await user.click(screen.getByRole('button', { name: /сохранить токен/i }))

      await waitFor(
        () => {
          expect(screen.getByText(expectedTitle)).toBeInTheDocument()
        },
        { timeout: 5000 }
      )
      // No navigation away on any error state
      expect(mockPush).not.toHaveBeenCalled()
    }
  )

  it(
    'clears the server error state when the user edits the token again',
    { timeout: 10000 },
    async () => {
      const user = userEvent.setup()
      const mockUpdateWbToken = vi.mocked(updateWbToken)
      mockUpdateWbToken.mockRejectedValueOnce(new Error('Invalid token')).mockResolvedValueOnce({
        id: 'key-id',
        keyName: 'wb_api_token',
        updatedAt: '2026-08-17T10:00:00Z',
      })

      renderForm()

      const tokenInput = screen.getByLabelText(/wb api токен/i)
      await user.clear(tokenInput)
      await user.type(tokenInput, validToken)
      await user.click(screen.getByRole('button', { name: /сохранить токен/i }))

      await waitFor(() => {
        expect(screen.getByText('Токен недействителен')).toBeInTheDocument()
      })

      // Editing clears the alert (handleTokenChange) and a retry succeeds + navigates
      await user.type(tokenInput, 'X')
      await waitFor(() => {
        expect(screen.queryByText('Токен недействителен')).not.toBeInTheDocument()
      })
      await user.clear(tokenInput)
      await user.type(tokenInput, validToken)
      await user.click(screen.getByRole('button', { name: /сохранить токен/i }))
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/processing')
      })
    }
  )
})
