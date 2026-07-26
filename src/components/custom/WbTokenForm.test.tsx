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
})
