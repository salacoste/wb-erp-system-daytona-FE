import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getCabinetCreationOperation } from '@/lib/api'
import { getCabinetTaxSettings, updateCabinetTaxSettings } from '@/lib/api/cabinet'
import { handleCreateCabinet } from '@/services/cabinets.service'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

import { CabinetCreationForm } from './CabinetCreationForm'

vi.mock('@/services/cabinets.service', () => ({ handleCreateCabinet: vi.fn() }))
// Partial barrel mock (sibling accountRecovery pattern): the indeterminate
// path reconciles the durable operation — keep it hermetic (no MSW, no fetch).
vi.mock('@/lib/api', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    getCabinetCreationOperation: vi.fn(),
  }
})
vi.mock('@/lib/api/cabinet', () => ({
  getCabinetTaxSettings: vi.fn(),
  updateCabinetTaxSettings: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

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

const createdCabinet = (targetMarginPct = 20) => ({
  // Story 167.9 typed settlement result consumed by the refactored seam.
  status: 'applied' as const,
  cabinet: { ...existingCabinet, name: 'Created Cabinet', targetMarginPct },
})

describe('CabinetCreationForm basic and hydration behavior', () => {
  let queryClient: QueryClient
  const push = vi.fn()

  const renderForm = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <CabinetCreationForm />
      </QueryClientProvider>
    )

  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
    vi.mocked(handleCreateCabinet).mockReset()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false, gcTime: 0 },
      },
    })
    useAuthStore.setState({
      user: { id: 'manager-basic', email: 'manager@test.local', role: 'Manager' },
      token: 'jwt-token',
      cabinetId: null,
      isAuthenticated: true,
    })
    ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push })
    vi.mocked(getCabinetTaxSettings).mockResolvedValue(existingCabinet)
    vi.mocked(updateCabinetTaxSettings).mockResolvedValue(existingCabinet)
  })

  afterEach(() => {
    cleanup()
    queryClient.clear()
  })

  it('renders accessible described controls with the Story minimum target size', () => {
    renderForm()

    const name = screen.getByLabelText(/название кабинета/i)
    const margin = screen.getByLabelText(/целевая маржа/i)
    const submit = screen.getByRole('button', { name: /создать кабинет/i })
    expect(screen.getByRole('form', { name: 'Форма создания кабинета' })).toBeInTheDocument()
    expect(name).toHaveClass('min-h-11')
    expect(margin).toHaveClass('min-h-11')
    expect(submit).toHaveClass('min-h-11')
    for (const input of [name, margin]) {
      const descriptionId = input.getAttribute('aria-describedby')
      expect(descriptionId).toBeTruthy()
      expect(document.getElementById(descriptionId!)).toBeInTheDocument()
    }
    expect(document.getElementById(margin.getAttribute('aria-describedby')!)).toHaveTextContent(
      /предлагаемое начальное значение — 20%/i
    )
  })

  it('validates name and target-margin boundaries before dispatch', async () => {
    const user = userEvent.setup()
    renderForm()
    const name = screen.getByLabelText(/название кабинета/i)
    const margin = screen.getByLabelText(/целевая маржа/i)

    await user.type(name, 'A')
    await user.tab()
    expect(await screen.findByText(/минимум 2 символа/i)).toBeInTheDocument()
    await user.clear(name)
    await user.type(name, 'Valid Cabinet')
    await user.clear(margin)
    await user.type(margin, '101')
    await user.click(screen.getByRole('button', { name: /создать кабинет/i }))

    expect(await screen.findByText(/от 0 до 100%/i)).toBeInTheDocument()
    expect(handleCreateCabinet).not.toHaveBeenCalled()
  })

  it.each([['Analyst'], [undefined]])('blocks creation for role %s', role => {
    useAuthStore.setState({
      user: role
        ? { id: 'restricted', email: 'restricted@test.local', role: role as 'Analyst' }
        : null,
    })
    renderForm()
    expect(screen.getByRole('button', { name: /создать кабинет/i })).toBeDisabled()
  })

  it('submits explicit zero once, reports success, and advances exactly once', async () => {
    const user = userEvent.setup()
    vi.mocked(handleCreateCabinet).mockResolvedValue(createdCabinet(0))
    renderForm()

    await user.type(screen.getByLabelText(/название кабинета/i), 'Created Cabinet')
    const margin = screen.getByLabelText(/целевая маржа/i)
    await user.clear(margin)
    await user.type(margin, '0')
    await user.click(screen.getByRole('button', { name: /создать кабинет/i }))

    await waitFor(() => expect(handleCreateCabinet).toHaveBeenCalledWith('Created Cabinet', 0))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/wb-token'))
    expect(push).toHaveBeenCalledTimes(1)
    expect(toast.success).toHaveBeenCalledTimes(1)
  })

  it('retains entered values and allows one deliberate retry after a pre-create error', async () => {
    const user = userEvent.setup()
    vi.mocked(handleCreateCabinet)
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce(createdCabinet(35))
    renderForm()
    const name = screen.getByLabelText(/название кабинета/i)
    const margin = screen.getByLabelText(/целевая маржа/i)
    await user.type(name, 'Retained Cabinet')
    await user.clear(margin)
    await user.type(margin, '35')
    await user.click(screen.getByRole('button', { name: /создать кабинет/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Network unavailable')
    expect(alert).toHaveFocus()
    expect(name).toHaveValue('Retained Cabinet')
    expect(margin).toHaveValue(35)
    expect(handleCreateCabinet).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /создать кабинет/i }))
    await waitFor(() => expect(handleCreateCabinet).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/wb-token'))
  })

  it.each([
    [null, 20],
    [0, 0],
    [37.5, 37.5],
  ])('hydrates persisted target %s as %s without writing', async (stored, shown) => {
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
    expect(updateCabinetTaxSettings).not.toHaveBeenCalled()
  })

  it('preserves a dirty margin through delayed hydration and background cache updates', async () => {
    const user = userEvent.setup()
    let resolveHydration!: (value: typeof existingCabinet) => void
    const hydration = new Promise<typeof existingCabinet>(resolve => {
      resolveHydration = resolve
    })
    useAuthStore.setState({ cabinetId: 'cabinet-1' })
    vi.mocked(getCabinetTaxSettings).mockReturnValue(hydration)
    renderForm()
    const margin = screen.getByLabelText(/целевая маржа/i)
    await user.clear(margin)
    await user.type(margin, '44')

    await act(async () => resolveHydration({ ...existingCabinet, targetMarginPct: 31 }))
    await waitFor(() => expect(margin).toHaveValue(44))
    act(() => {
      queryClient.setQueryData(['cabinet-tax', 'cabinet-1'], {
        ...existingCabinet,
        name: 'Background Cabinet',
        targetMarginPct: 28,
      })
    })
    await waitFor(() => {
      expect(screen.getByLabelText(/название кабинета/i)).toHaveValue('Background Cabinet')
      expect(margin).toHaveValue(44)
    })
  })

  it('updates an existing cabinet once while pending and resets committed values on success', async () => {
    const user = userEvent.setup()
    let resolveUpdate!: (value: typeof existingCabinet) => void
    const pendingUpdate = new Promise<typeof existingCabinet>(resolve => {
      resolveUpdate = resolve
    })
    useAuthStore.setState({ cabinetId: 'cabinet-1' })
    vi.mocked(getCabinetTaxSettings).mockResolvedValue({
      ...existingCabinet,
      targetMarginPct: 42,
    })
    vi.mocked(updateCabinetTaxSettings).mockReturnValue(pendingUpdate)
    renderForm()
    const margin = await screen.findByLabelText(/целевая маржа/i)
    await waitFor(() => expect(margin).toHaveValue(20))
    await user.clear(margin)
    await user.type(margin, '42')
    await user.click(screen.getByRole('button', { name: /сохранить и продолжить/i }))
    await waitFor(() =>
      expect(updateCabinetTaxSettings).toHaveBeenCalledWith('cabinet-1', { targetMarginPct: 42 })
    )

    await act(async () => {
      screen
        .getByRole('form', { name: 'Форма создания кабинета' })
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    expect(updateCabinetTaxSettings).toHaveBeenCalledTimes(1)
    await act(async () => resolveUpdate({ ...existingCabinet, targetMarginPct: 42 }))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/wb-token'))
    expect(margin).toHaveValue(42)
    expect(handleCreateCabinet).not.toHaveBeenCalled()
  })
})

describe('CabinetCreationForm stale/indeterminate settlement (Story 167.9, ported)', () => {
  let queryClient: QueryClient
  const mockPush = vi.fn()
  const existingCabinetStale = {
    ...existingCabinet,
  }

  beforeEach(() => {
    sessionStorage.clear()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    vi.clearAllMocks()
    vi.mocked(getCabinetCreationOperation).mockReset()
    useAuthStore.setState({
      user: { id: 'user-b', email: 'b@test.local', role: 'Owner' },
      token: 'jwt-live-session',
      sessionNonce: 'nonce-live-session',
      cabinetId: null,
      isAuthenticated: true,
    })
    ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push: mockPush })
    vi.mocked(getCabinetTaxSettings).mockResolvedValue(existingCabinetStale)
    vi.mocked(updateCabinetTaxSettings).mockResolvedValue(existingCabinetStale)
  })

  afterEach(() => {
    cleanup()
    queryClient.clear()
  })

  it(
    'stale settlement: no toast, no navigation, no reset, input retained',
    { timeout: 10000 },
    async () => {
      const user = userEvent.setup()
      vi.mocked(handleCreateCabinet).mockResolvedValue({
        status: 'stale',
        operationId: '9ca8c2ba-0b3f-4a2a-b20c-27db4d60a7b0',
      })

      render(
        <QueryClientProvider client={queryClient}>
          <CabinetCreationForm />
        </QueryClientProvider>
      )

      const nameInput = screen.getByLabelText(/название кабинета/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Test Cabinet')
      await new Promise(resolve => setTimeout(resolve, 100))

      await user.click(screen.getByRole('button', { name: /создать кабинет/i }))

      await waitFor(() => expect(handleCreateCabinet).toHaveBeenCalled(), { timeout: 5000 })
      // Let any (forbidden) success effects flush before asserting suppression.
      await new Promise(resolve => setTimeout(resolve, 300))

      expect(toast.success).not.toHaveBeenCalled()
      expect(toast.error).not.toHaveBeenCalled()
      expect(mockPush).not.toHaveBeenCalled()
      // Form is NOT reset — the live session's input must survive.
      expect(screen.getByLabelText(/название кабинета/i)).toHaveValue('Test Cabinet')
    }
  )

  it(
    'indeterminate settlement surfaces the safe-reconciliation alert for the live owner (D-1/PB-1)',
    { timeout: 10000 },
    async () => {
      // D-1 (PB-1): the cabinet may exist server-side for THIS user — indicate
      // via the recovery alert instead of silently swallowing the create.
      const user = userEvent.setup()
      vi.mocked(handleCreateCabinet).mockResolvedValue({
        status: 'indeterminate',
        operationId: '9ca8c2ba-0b3f-4a2a-b20c-27db4d60a7b0',
      })

      render(
        <QueryClientProvider client={queryClient}>
          <CabinetCreationForm />
        </QueryClientProvider>
      )

      const nameInput = screen.getByLabelText(/название кабинета/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Test Cabinet')
      await new Promise(resolve => setTimeout(resolve, 100))

      await user.click(screen.getByRole('button', { name: /создать кабинет/i }))

      const recovery = await screen.findByRole('alert', {}, { timeout: 5000 })
      expect(recovery).toHaveTextContent(/безопасно подтвердить/)
      expect(toast.success).not.toHaveBeenCalled()
      expect(mockPush).not.toHaveBeenCalled()
      // Form is NOT reset — the live session's input must survive.
      expect(screen.getByLabelText(/название кабинета/i)).toHaveValue('Test Cabinet')
    }
  )
})
