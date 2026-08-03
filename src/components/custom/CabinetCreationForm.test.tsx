import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CabinetCreationForm } from './CabinetCreationForm'
import { handleCreateCabinet } from '@/services/cabinets.service'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { getCabinetTaxSettings, updateCabinetTaxSettings } from '@/lib/api/cabinet'

// Mock dependencies
vi.mock('@/services/cabinets.service', () => ({
  handleCreateCabinet: vi.fn(),
}))

vi.mock('@/lib/api/cabinet', () => ({
  getCabinetTaxSettings: vi.fn(),
  updateCabinetTaxSettings: vi.fn(),
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

describe('CabinetCreationForm', () => {
  let queryClient: QueryClient
  const mockPush = vi.fn()
  const existingCabinet = {
    id: 'cabinet-1',
    name: 'Existing Cabinet',
    isActive: true,
    createdAt: '2025-01-12T10:00:00Z',
    updatedAt: '2025-01-12T10:00:00Z',
    taxSystem: null,
    taxRate: null,
    vatPayer: false,
    vatRate: null,
    targetMarginPct: null as number | null,
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false, gcTime: 0 },
      },
    })
    vi.clearAllMocks()
    useAuthStore.setState({
      user: {
        id: 'manager-1',
        email: 'manager@test.local',
        role: 'Manager',
      },
      token: 'jwt-token',
      cabinetId: null,
      isAuthenticated: true,
    })
    ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    })
    vi.mocked(getCabinetTaxSettings).mockResolvedValue(existingCabinet)
    vi.mocked(updateCabinetTaxSettings).mockResolvedValue(existingCabinet)
  })

  afterEach(() => {
    cleanup()
    queryClient.clear()
  })

  const renderForm = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CabinetCreationForm />
      </QueryClientProvider>
    )
  }

  it('renders cabinet creation form with name field', { timeout: 5000 }, () => {
    renderForm()

    expect(screen.getByLabelText(/название кабинета/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/целевая маржа/i)).toHaveValue(20)
    expect(screen.getByRole('button', { name: /создать кабинет/i })).toBeInTheDocument()
  })

  it('validates cabinet name minimum length', { timeout: 5000 }, async () => {
    const user = userEvent.setup()
    renderForm()

    const nameInput = screen.getByLabelText(/название кабинета/i)
    await user.type(nameInput, 'A')
    await user.tab()

    await waitFor(
      () => {
        expect(screen.getByText(/минимум 2 символа/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('validates cabinet name is required', { timeout: 5000 }, async () => {
    const user = userEvent.setup()
    renderForm()

    const nameInput = screen.getByLabelText(/название кабинета/i)
    // Focus and blur to trigger validation
    await user.click(nameInput)
    await user.tab()

    await waitFor(
      () => {
        expect(screen.getByText(/минимум 2 символа/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('keeps cabinet creation disabled for analyst users', { timeout: 5000 }, async () => {
    useAuthStore.getState().setUser({
      id: 'analyst-1',
      email: 'analyst@test.local',
      role: 'Analyst',
    })
    renderForm()

    const submitButton = screen.getByRole('button', { name: /создать кабинет/i })
    expect(submitButton).toBeDisabled()
  })

  it('keeps cabinet creation disabled when role is missing', { timeout: 5000 }, async () => {
    useAuthStore.setState({
      user: null,
      token: 'jwt-token',
      cabinetId: null,
      isAuthenticated: true,
    })
    renderForm()

    const submitButton = screen.getByRole('button', { name: /создать кабинет/i })
    expect(submitButton).toBeDisabled()
  })

  it('calls handleCreateCabinet on valid form submission', { timeout: 10000 }, async () => {
    const user = userEvent.setup()
    const mockHandleCreateCabinet = vi.mocked(handleCreateCabinet)
    mockHandleCreateCabinet.mockResolvedValue({
      cabinet: {
        id: 'cabinet-1',
        name: 'Test Cabinet',
        isActive: true,
        createdAt: '2025-01-12T10:00:00Z',
        updatedAt: '2025-01-12T10:00:00Z',
        targetMarginPct: 20,
      },
    })

    renderForm()

    const nameInput = screen.getByLabelText(/название кабинета/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Test Cabinet')

    // Small delay to allow form validation
    await new Promise(resolve => setTimeout(resolve, 100))

    const submitButton = screen.getByRole('button', { name: /создать кабинет/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(mockHandleCreateCabinet).toHaveBeenCalledWith('Test Cabinet', 20)
      },
      { timeout: 5000 }
    )
  })

  it('shows loading state during submission', { timeout: 10000 }, async () => {
    const user = userEvent.setup()
    const mockHandleCreateCabinet = vi.mocked(handleCreateCabinet)
    let resolvePromise: (value: Record<string, unknown>) => void
    const promise = new Promise<Record<string, unknown>>(resolve => {
      resolvePromise = resolve
    })
    mockHandleCreateCabinet.mockReturnValue(
      promise as unknown as ReturnType<typeof handleCreateCabinet>
    )

    renderForm()

    const nameInput = screen.getByLabelText(/название кабинета/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Test Cabinet')

    // Small delay to allow form validation
    await new Promise(resolve => setTimeout(resolve, 100))

    const submitButton = screen.getByRole('button', { name: /создать кабинет/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /создание.../i })).toBeInTheDocument()
        expect(screen.getByRole('button')).toBeDisabled()
      },
      { timeout: 3000 }
    )

    // Resolve to complete test
    resolvePromise!({
      cabinet: {
        id: 'cabinet-1',
        name: 'Test Cabinet',
        isActive: true,
        createdAt: '2025-01-12T10:00:00Z',
        updatedAt: '2025-01-12T10:00:00Z',
        targetMarginPct: 20,
      },
    })

    await waitFor(
      () => {
        expect(mockHandleCreateCabinet).toHaveBeenCalled()
      },
      { timeout: 3000 }
    )
  })

  it('handles creation errors', { timeout: 10000 }, async () => {
    const user = userEvent.setup()
    const mockHandleCreateCabinet = vi.mocked(handleCreateCabinet)
    mockHandleCreateCabinet.mockRejectedValue(new Error('Failed to create cabinet'))

    renderForm()

    const nameInput = screen.getByLabelText(/название кабинета/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Test Cabinet')

    // Small delay to allow form validation
    await new Promise(resolve => setTimeout(resolve, 100))

    const submitButton = screen.getByRole('button', { name: /создать кабинет/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(toast.error).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )
  })

  it('navigates to WB token page on success', { timeout: 10000 }, async () => {
    const user = userEvent.setup()
    const mockHandleCreateCabinet = vi.mocked(handleCreateCabinet)
    mockHandleCreateCabinet.mockResolvedValue({
      cabinet: {
        id: 'cabinet-1',
        name: 'Test Cabinet',
        isActive: true,
        createdAt: '2025-01-12T10:00:00Z',
        updatedAt: '2025-01-12T10:00:00Z',
        targetMarginPct: 20,
      },
    })

    renderForm()

    const nameInput = screen.getByLabelText(/название кабинета/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Test Cabinet')

    // Small delay to allow form validation
    await new Promise(resolve => setTimeout(resolve, 100))

    const submitButton = screen.getByRole('button', { name: /создать кабинет/i })
    await user.click(submitButton)

    await waitFor(
      () => {
        expect(mockHandleCreateCabinet).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )

    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith('/wb-token')
        expect(toast.success).toHaveBeenCalled()
      },
      { timeout: 5000 }
    )
  })

  it('accepts and persists an explicit 0% target margin', { timeout: 10000 }, async () => {
    const user = userEvent.setup()
    vi.mocked(handleCreateCabinet).mockResolvedValue({
      cabinet: {
        id: 'cabinet-1',
        name: 'Zero Margin',
        isActive: true,
        createdAt: '2025-01-12T10:00:00Z',
        updatedAt: '2025-01-12T10:00:00Z',
        targetMarginPct: 0,
      },
    })
    renderForm()

    await user.type(screen.getByLabelText(/название кабинета/i), 'Zero Margin')
    const marginInput = screen.getByLabelText(/целевая маржа/i)
    await user.clear(marginInput)
    await user.type(marginInput, '0')
    await user.click(screen.getByRole('button', { name: /создать кабинет/i }))

    await waitFor(() => expect(handleCreateCabinet).toHaveBeenCalledWith('Zero Margin', 0))
  })

  it.each([
    ['negative', '-1'],
    ['over 100', '101'],
    ['non-finite', '1e309'],
  ])('blocks %s target margin input', { timeout: 10000 }, async (_label, value) => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText(/название кабинета/i), 'Invalid Margin')
    const marginInput = screen.getByLabelText(/целевая маржа/i)
    await user.clear(marginInput)
    await user.type(marginInput, value)
    await user.click(screen.getByRole('button', { name: /создать кабинет/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/от 0 до 100|корректное число|укажите целевую маржу/i)
      ).toBeInTheDocument()
    })
    expect(handleCreateCabinet).not.toHaveBeenCalled()
  })

  it('does not advance when target margin persistence fails', { timeout: 10000 }, async () => {
    const user = userEvent.setup()
    vi.mocked(handleCreateCabinet).mockRejectedValue(
      new Error('Cabinet created, but target margin could not be saved')
    )
    renderForm()

    await user.type(screen.getByLabelText(/название кабинета/i), 'Failed Margin')
    await user.click(screen.getByRole('button', { name: /создать кабинет/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/маржа/i)))
    expect(mockPush).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('retries the failed post-create margin PUT without creating a duplicate', async () => {
    const user = userEvent.setup()
    vi.mocked(handleCreateCabinet).mockImplementation(async () => {
      useAuthStore.getState().setCabinetId('cabinet-1')
      throw new Error('Cabinet created, but target margin could not be saved')
    })
    vi.mocked(updateCabinetTaxSettings).mockResolvedValue({
      ...existingCabinet,
      name: 'Retry Cabinet',
      targetMarginPct: 35,
    })
    renderForm()

    await user.type(screen.getByLabelText(/название кабинета/i), 'Retry Cabinet')
    const marginInput = screen.getByLabelText(/целевая маржа/i)
    await user.clear(marginInput)
    await user.type(marginInput, '35')
    await user.click(screen.getByRole('button', { name: /создать кабинет/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /сохранить и продолжить/i })).toBeInTheDocument()
    )
    expect(marginInput).toHaveValue(35)

    await user.click(screen.getByRole('button', { name: /сохранить и продолжить/i }))

    await waitFor(() =>
      expect(updateCabinetTaxSettings).toHaveBeenCalledWith('cabinet-1', {
        targetMarginPct: 35,
      })
    )
    expect(handleCreateCabinet).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith('/wb-token')
  })

  it.each([
    [null, 20],
    [0, 0],
    [37.5, 37.5],
  ])('hydrates reopened persisted target %s as %s without writing', async (stored, shown) => {
    useAuthStore.setState({ cabinetId: 'cabinet-1' })
    vi.mocked(getCabinetTaxSettings).mockResolvedValue({
      ...existingCabinet,
      targetMarginPct: stored,
    })
    renderForm()

    await waitFor(() => {
      expect(screen.getByLabelText(/название кабинета/i)).toHaveValue('Existing Cabinet')
      expect(screen.getByLabelText(/целевая маржа/i)).toHaveValue(shown)
    })
    expect(handleCreateCabinet).not.toHaveBeenCalled()
    expect(updateCabinetTaxSettings).not.toHaveBeenCalled()
  })
})
