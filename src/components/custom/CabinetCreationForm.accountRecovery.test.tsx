import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getCabinetTaxSettings, updateCabinetTaxSettings } from '@/lib/api/cabinet'
import { handleCreateCabinet } from '@/services/cabinets.service'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

import { CabinetCreationForm } from './CabinetCreationForm'
import {
  CREATE_PENDING_PHASE,
  UPDATE_PENDING_PHASE,
  admitRecoveryOperation,
  clearRecoveryMarker,
  finishRecoveryOperation,
  readRecoveryMarker,
  recoveryMarkerKey,
} from './cabinetCreationRecovery'

vi.mock('@/services/cabinets.service', () => ({ handleCreateCabinet: vi.fn() }))
vi.mock('@/lib/api/cabinet', () => ({
  getCabinetTaxSettings: vi.fn(),
  updateCabinetTaxSettings: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }))
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const cabinetResult = (name: string) => ({
  status: 'applied' as const,
  cabinet: {
    id: `cabinet-${name}`,
    name,
    isActive: true,
    createdAt: '2025-01-12T10:00:00Z',
    updatedAt: '2025-01-12T10:00:00Z',
    targetMarginPct: 20,
  },
})

const existingCabinet = {
  id: 'cabinet-existing',
  name: 'Existing Cabinet',
  isActive: true,
  createdAt: '2025-01-12T10:00:00Z',
  updatedAt: '2025-01-12T10:00:00Z',
  taxSystem: null,
  taxRate: null,
  vatPayer: false,
  vatRate: null,
  targetMarginPct: 20,
}

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, reject, resolve }
}

describe('CabinetCreationForm account-scoped recovery admission', () => {
  let queryClient: QueryClient
  const push = vi.fn()

  const setAccount = (id: string, cabinetId: string | null = null) => {
    useAuthStore.setState({
      user: { id, email: `${id}@test.local`, role: 'Manager' },
      token: 'jwt-token',
      cabinetId,
      isAuthenticated: true,
    })
  }

  const renderForm = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <CabinetCreationForm />
      </QueryClientProvider>
    )

  const submitCreate = async (name: string) => {
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/название кабинета/i), name)
    await user.click(screen.getByRole('button', { name: /создать кабинет/i }))
  }

  const submitNatively = async () => {
    await act(async () => {
      screen
        .getByRole('form', { name: 'Форма создания кабинета' })
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
  }

  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
    vi.mocked(handleCreateCabinet).mockReset()
    vi.mocked(getCabinetTaxSettings).mockResolvedValue(existingCabinet)
    vi.mocked(updateCabinetTaxSettings).mockReset()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false, gcTime: 0 },
      },
    })
    ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push })
    setAccount('manager-a')
  })

  afterEach(() => {
    cleanup()
    queryClient.clear()
  })

  it('keeps held account A blocked after switching to B and back before settlement', async () => {
    const heldA = deferred<Awaited<ReturnType<typeof handleCreateCabinet>>>()
    vi.mocked(handleCreateCabinet)
      .mockReturnValueOnce(heldA.promise)
      .mockResolvedValueOnce(cabinetResult('duplicate-a'))

    const firstA = renderForm()
    await submitCreate('held-a')
    await waitFor(() => expect(handleCreateCabinet).toHaveBeenCalledTimes(1))

    act(() => setAccount('manager-b'))
    await waitFor(() => expect(useAuthStore.getState().user?.id).toBe('manager-b'))
    firstA.unmount()

    act(() => setAccount('manager-a'))
    renderForm()
    await submitCreate('duplicate-a')
    await userEvent.setup().keyboard('{Enter}')
    await submitNatively()

    expect(handleCreateCabinet).toHaveBeenCalledTimes(1)

    await act(async () => heldA.resolve(cabinetResult('held-a')))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/wb-token'))
  })

  it('preserves B admission and suppresses stale A success side effects', async () => {
    const heldA = deferred<Awaited<ReturnType<typeof handleCreateCabinet>>>()
    const heldB = deferred<Awaited<ReturnType<typeof handleCreateCabinet>>>()
    vi.mocked(handleCreateCabinet)
      .mockReturnValueOnce(heldA.promise)
      .mockReturnValueOnce(heldB.promise)

    const firstA = renderForm()
    await submitCreate('held-a')
    await waitFor(() => expect(handleCreateCabinet).toHaveBeenCalledTimes(1))

    act(() => setAccount('manager-b'))
    firstA.unmount()
    const activeB = renderForm()
    await submitCreate('held-b')
    await waitFor(() => expect(handleCreateCabinet).toHaveBeenCalledTimes(2))

    const bMarkerKey = recoveryMarkerKey('manager-b')
    const bMarkerBefore = sessionStorage.getItem(bMarkerKey)
    expect(bMarkerBefore).not.toBeNull()

    await act(async () => heldA.resolve(cabinetResult('held-a')))

    expect(sessionStorage.getItem(bMarkerKey)).toBe(bMarkerBefore)
    expect(push).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/название кабинета/i)).toHaveValue('held-b')

    activeB.unmount()
    renderForm()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    await submitNatively()
    expect(handleCreateCabinet).toHaveBeenCalledTimes(2)

    await act(async () => heldB.reject(new Error('cleanup-b')))
  })

  it('preserves a held B PUT admission when stale A succeeds and across B remount', async () => {
    const heldA = deferred<Awaited<ReturnType<typeof handleCreateCabinet>>>()
    const heldB = deferred<typeof existingCabinet>()
    vi.mocked(handleCreateCabinet).mockReturnValue(heldA.promise)
    vi.mocked(updateCabinetTaxSettings).mockReturnValue(heldB.promise)
    const firstA = renderForm()
    await submitCreate('held-a')
    await waitFor(() => expect(handleCreateCabinet).toHaveBeenCalledTimes(1))

    act(() => setAccount('manager-b', 'cabinet-existing'))
    firstA.unmount()
    const activeB = renderForm()
    const margin = await screen.findByLabelText(/целевая маржа/i)
    await waitFor(() => expect(margin).toHaveValue(20))
    const user = userEvent.setup()
    await user.clear(margin)
    await user.type(margin, '41')
    await user.click(screen.getByRole('button', { name: /сохранить и продолжить/i }))
    await waitFor(() => expect(updateCabinetTaxSettings).toHaveBeenCalledTimes(1))
    const bKey = recoveryMarkerKey('manager-b')
    const bMarker = sessionStorage.getItem(bKey)

    await act(async () => heldA.resolve(cabinetResult('held-a')))
    expect(sessionStorage.getItem(bKey)).toBe(bMarker)
    expect(margin).toHaveValue(41)
    expect(push).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()

    activeB.unmount()
    renderForm()
    expect(await screen.findByRole('alert')).toHaveFocus()
    await submitNatively()
    expect(updateCabinetTaxSettings).toHaveBeenCalledTimes(1)
    await act(async () => heldB.reject(new Error('cleanup-b-put')))
  })

  it('does not surface stale A failure recovery or toast in active account B', async () => {
    const heldA = deferred<Awaited<ReturnType<typeof handleCreateCabinet>>>()
    vi.mocked(handleCreateCabinet).mockReturnValue(heldA.promise)
    const firstA = renderForm()
    await submitCreate('held-a')
    await waitFor(() => expect(handleCreateCabinet).toHaveBeenCalledTimes(1))

    act(() => setAccount('manager-b'))
    firstA.unmount()
    renderForm()
    expect(await screen.findByRole('button', { name: /создать кабинет/i })).toBeEnabled()

    await act(async () => heldA.reject(new Error('A-only network failure')))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(toast.error).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
  })

  it('does not let an older same-user settlement clear a newer operation', async () => {
    const heldOld = deferred<Awaited<ReturnType<typeof handleCreateCabinet>>>()
    vi.mocked(handleCreateCabinet).mockReturnValue(heldOld.promise)
    const oldRender = renderForm()
    await submitCreate('old-operation')
    await waitFor(() => expect(handleCreateCabinet).toHaveBeenCalledTimes(1))
    const oldRead = readRecoveryMarker('manager-a')
    expect(oldRead.kind).toBe('present')
    const oldMarker = oldRead.kind === 'present' ? oldRead.marker : null
    expect(clearRecoveryMarker(oldMarker!)).toBe('applied')
    const newerMarker = admitRecoveryOperation('manager-a', CREATE_PENDING_PHASE)!
    const newerBytes = sessionStorage.getItem(recoveryMarkerKey('manager-a'))
    oldRender.unmount()
    renderForm()

    await act(async () => heldOld.resolve(cabinetResult('old-operation')))
    expect(sessionStorage.getItem(recoveryMarkerKey('manager-a'))).toBe(newerBytes)
    expect(push).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
    finishRecoveryOperation(oldMarker!)
    finishRecoveryOperation(newerMarker)
  })

  it('fails closed for malformed A storage without blocking or changing B', async () => {
    const malformed = '{"phase":'
    sessionStorage.setItem(recoveryMarkerKey('manager-a'), malformed)
    act(() => setAccount('manager-b'))
    vi.mocked(handleCreateCabinet).mockResolvedValue(cabinetResult('valid-b'))
    renderForm()
    await submitCreate('valid-b')
    await waitFor(() => expect(handleCreateCabinet).toHaveBeenCalledTimes(1))
    expect(sessionStorage.getItem(recoveryMarkerKey('manager-a'))).toBe(malformed)

    cleanup()
    act(() => setAccount('manager-a'))
    renderForm()
    const recovery = await screen.findByRole('alert')
    expect(recovery).toHaveFocus()
    expect(screen.getByRole('button', { name: /создать кабинет/i })).toBeDisabled()
    expect(sessionStorage.getItem(recoveryMarkerKey('manager-a'))).toBe(malformed)
  })

  it('persists token partial success and blocks click, Enter, and native submit on remount', async () => {
    vi.mocked(handleCreateCabinet).mockRejectedValue(
      new Error('Cabinet created, but token update failed')
    )
    const first = renderForm()
    await submitCreate('token-partial')
    const recovery = await screen.findByRole('alert')
    expect(recovery).toHaveTextContent(/кабинет уже создан/i)
    expect(recovery).toHaveFocus()
    first.unmount()
    renderForm()
    expect(await screen.findByRole('button', { name: /создать кабинет/i })).toBeDisabled()

    await userEvent.setup().keyboard('{Enter}')
    await submitNatively()
    expect(handleCreateCabinet).toHaveBeenCalledTimes(1)
  })

  it('keeps post-create margin recovery update-only and retains the submitted margin', async () => {
    const user = userEvent.setup()
    vi.mocked(handleCreateCabinet).mockImplementation(async () => {
      useAuthStore.getState().setCabinetId('cabinet-existing')
      throw new Error('Cabinet created, but target margin could not be saved')
    })
    vi.mocked(updateCabinetTaxSettings).mockResolvedValue({
      ...existingCabinet,
      name: 'Margin Recovery',
      targetMarginPct: 35,
    })
    renderForm()
    await user.type(screen.getByLabelText(/название кабинета/i), 'Margin Recovery')
    const margin = screen.getByLabelText(/целевая маржа/i)
    await user.clear(margin)
    await user.type(margin, '35')
    await user.click(screen.getByRole('button', { name: /создать кабинет/i }))

    const recovery = await screen.findByRole('alert')
    expect(recovery).toHaveTextContent(/маржа не сохранилась/i)
    expect(margin).toHaveValue(35)
    await user.click(screen.getByRole('button', { name: /сохранить и продолжить/i }))

    await waitFor(() =>
      expect(updateCabinetTaxSettings).toHaveBeenCalledWith('cabinet-existing', {
        targetMarginPct: 35,
      })
    )
    expect(handleCreateCabinet).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(push).toHaveBeenCalledWith('/wb-token'))
  })

  it('transitions a failed existing-cabinet update into deliberate PUT-only recovery', async () => {
    const user = userEvent.setup()
    setAccount('manager-a', 'cabinet-existing')
    vi.mocked(updateCabinetTaxSettings)
      .mockRejectedValueOnce(new Error('PUT unavailable'))
      .mockResolvedValueOnce({ ...existingCabinet, targetMarginPct: 39 })
    renderForm()
    const margin = await screen.findByLabelText(/целевая маржа/i)
    await waitFor(() => expect(margin).toHaveValue(20))
    await user.clear(margin)
    await user.type(margin, '39')
    await user.click(screen.getByRole('button', { name: /сохранить и продолжить/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/не удалось сохранить/i)
    expect(margin).toHaveValue(39)
    await user.click(screen.getByRole('button', { name: /сохранить и продолжить/i }))
    await waitFor(() => expect(updateCabinetTaxSettings).toHaveBeenCalledTimes(2))
    expect(handleCreateCabinet).not.toHaveBeenCalled()
    await waitFor(() => expect(push).toHaveBeenCalledWith('/wb-token'))
  })

  it.each([
    [CREATE_PENDING_PHASE, null, /создать кабинет/i],
    [UPDATE_PENDING_PHASE, 'cabinet-existing', /сохранить и продолжить/i],
  ])('blocks a cold %s marker including native submit', async (phase, cabinetId, buttonName) => {
    const marker = admitRecoveryOperation('manager-a', phase)!
    finishRecoveryOperation(marker)
    setAccount('manager-a', cabinetId)
    renderForm()
    expect(await screen.findByRole('alert')).toHaveFocus()
    expect(screen.getByRole('button', { name: buttonName })).toBeDisabled()
    await submitNatively()
    expect(handleCreateCabinet).not.toHaveBeenCalled()
    expect(updateCabinetTaxSettings).not.toHaveBeenCalled()
  })

  it('fails closed without dispatch when durable admission write throws', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'sessionStorage')
    const storage = window.sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: {
        get length() {
          return storage.length
        },
        clear: storage.clear.bind(storage),
        getItem: storage.getItem.bind(storage),
        key: storage.key.bind(storage),
        removeItem: storage.removeItem.bind(storage),
        setItem: () => {
          throw new DOMException('Storage unavailable', 'QuotaExceededError')
        },
      } satisfies Storage,
    })
    try {
      renderForm()
      await submitCreate('no-durable-admission')
      expect(await screen.findByRole('alert')).toHaveFocus()
      expect(handleCreateCabinet).not.toHaveBeenCalled()
    } finally {
      Object.defineProperty(window, 'sessionStorage', descriptor!)
    }
  })
})
