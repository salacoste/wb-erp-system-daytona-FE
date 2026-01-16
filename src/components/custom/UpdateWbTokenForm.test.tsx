import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UpdateWbTokenForm } from './UpdateWbTokenForm'
import * as api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('@/lib/api', () => ({
  updateWbToken: vi.fn(),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('UpdateWbTokenForm', () => {
  let queryClient: QueryClient
  const cabinetId = 'cabinet-uuid'
  const keyName = 'wb_api_token'
  // Valid JWT-like token (3 parts, >50 chars total)
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
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      token: 'jwt-token',
    })
  })

  afterEach(() => {
    cleanup()
    queryClient.clear()
  })

  const renderForm = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <UpdateWbTokenForm cabinetId={cabinetId} keyName={keyName} />
      </QueryClientProvider>
    )
  }

  it('renders update token form', () => {
    renderForm()

    expect(
      screen.getByLabelText(/новый wb api токен/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /обновить токен/i }),
    ).toBeInTheDocument()
  })

  it('validates token minimum length', async () => {
    const user = userEvent.setup()
    renderForm()

    const tokenInput = screen.getByLabelText(/новый wb api токен/i)
    await user.type(tokenInput, 'short')
    await user.tab()

    await waitFor(
      () => {
        expect(
          screen.getByText(/слишком коротким/i),
        ).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('validates token format (JWT structure)', async () => {
    const user = userEvent.setup()
    renderForm()

    const tokenInput = screen.getByLabelText(/новый wb api токен/i)
    // Invalid JWT format (only 2 parts instead of 3, but long enough to pass min length)
    const invalidToken = 'header.payload.extra.chars.to.meet.min.length.requirement.of.fifty.chars'
    await user.clear(tokenInput)
    await user.type(tokenInput, invalidToken)
    await user.tab()

    await waitFor(
      () => {
        expect(
          screen.getByText(/формат токена/i),
        ).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('calls updateWbToken API on valid form submission', async () => {
    const user = userEvent.setup()
    const mockUpdateWbToken = vi.mocked(api.updateWbToken)
    mockUpdateWbToken.mockResolvedValue({
      id: 'key-uuid',
      keyName: 'wb_api_token',
      updatedAt: '2025-01-12T10:00:00Z',
    })

    renderForm()

    const tokenInput = screen.getByLabelText(/новый wb api токен/i)
    await user.clear(tokenInput)
    await user.type(tokenInput, validToken)
    
    // Small delay to allow form validation
    await new Promise((resolve) => setTimeout(resolve, 100))
    
    const submitButton = screen.getByRole('button', { name: /обновить токен/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(mockUpdateWbToken).toHaveBeenCalledWith(
          cabinetId,
          keyName,
          validToken,
          'jwt-token',
        )
      },
      { timeout: 5000 }
    )
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    const mockUpdateWbToken = vi.mocked(api.updateWbToken)
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    mockUpdateWbToken.mockReturnValue(promise as Promise<any>)

    renderForm()

    const tokenInput = screen.getByLabelText(/новый wb api токен/i)
    await user.clear(tokenInput)
    await user.type(tokenInput, validToken)
    
    // Small delay to allow form validation
    await new Promise((resolve) => setTimeout(resolve, 100))
    
    const submitButton = screen.getByRole('button', { name: /обновить токен/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: /обновление.../i }),
        ).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /обновление.../i })).toBeDisabled()
      },
      { timeout: 3000 }
    )

    // Resolve to complete test
    resolvePromise!({
      id: 'key-uuid',
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

  it('handles invalid token error', async () => {
    const user = userEvent.setup()
    const mockUpdateWbToken = vi.mocked(api.updateWbToken)
    mockUpdateWbToken.mockRejectedValue(
      new Error('WB API token is invalid or expired'),
    )

    renderForm()

    const tokenInput = screen.getByLabelText(/новый wb api токен/i)
    await user.clear(tokenInput)
    await user.type(tokenInput, validToken)
    
    // Small delay to allow form validation
    await new Promise((resolve) => setTimeout(resolve, 100))
    
    const submitButton = screen.getByRole('button', { name: /обновить токен/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(toast.error).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )
  })

  it('handles permission error', async () => {
    const user = userEvent.setup()
    const mockUpdateWbToken = vi.mocked(api.updateWbToken)
    mockUpdateWbToken.mockRejectedValue(
      new Error('Insufficient permissions to update token'),
    )

    renderForm()

    const tokenInput = screen.getByLabelText(/новый wb api токен/i)
    await user.clear(tokenInput)
    await user.type(tokenInput, validToken)
    
    // Small delay to allow form validation
    await new Promise((resolve) => setTimeout(resolve, 100))
    
    const submitButton = screen.getByRole('button', { name: /обновить токен/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('прав'),
        )
      },
      { timeout: 5000 }
    )
  })

  it('clears form on success', async () => {
    const user = userEvent.setup()
    const mockUpdateWbToken = vi.mocked(api.updateWbToken)
    mockUpdateWbToken.mockResolvedValue({
      id: 'key-uuid',
      keyName: 'wb_api_token',
      updatedAt: '2025-01-12T10:00:00Z',
    })

    renderForm()

    const tokenInput = screen.getByLabelText(/новый wb api токен/i)
    await user.clear(tokenInput)
    await user.type(tokenInput, validToken)
    
    // Small delay to allow form validation
    await new Promise((resolve) => setTimeout(resolve, 100))
    
    const submitButton = screen.getByRole('button', { name: /обновить токен/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(mockUpdateWbToken).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )

    await waitFor(
      () => {
        expect(tokenInput).toHaveValue('')
        expect(toast.success).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )
  })

  it('calls onSuccess callback when provided', async () => {
    const user = userEvent.setup()
    const mockOnSuccess = vi.fn()
    const mockUpdateWbToken = vi.mocked(api.updateWbToken)
    mockUpdateWbToken.mockResolvedValue({
      id: 'key-uuid',
      keyName: 'wb_api_token',
      updatedAt: '2025-01-12T10:00:00Z',
    })

    render(
      <QueryClientProvider client={queryClient}>
        <UpdateWbTokenForm
          cabinetId={cabinetId}
          keyName={keyName}
          onSuccess={mockOnSuccess}
        />
      </QueryClientProvider>
    )

    const tokenInput = screen.getByLabelText(/новый wb api токен/i)
    await user.clear(tokenInput)
    await user.type(tokenInput, validToken)
    
    // Small delay to allow form validation
    await new Promise((resolve) => setTimeout(resolve, 100))
    
    const submitButton = screen.getByRole('button', { name: /обновить токен/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(mockUpdateWbToken).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )

    await waitFor(
      () => {
        expect(mockOnSuccess).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )
  })
})

