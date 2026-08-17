import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createCabinet, getCabinetCreationOperation } from '@/lib/api'
import { getCabinetTaxSettings, updateCabinetTaxSettings } from '@/lib/api/cabinet'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

import { CabinetCreationForm } from './CabinetCreationForm'
import { recoveryMarkerKey } from './cabinetCreationRecovery'
import type { CreateCabinetResponse } from '@/types/cabinet'

// Story 167.5 (2026-08-17): the REAL 167.9 settlement service runs unmocked —
// only the transport layer (lib/api) is mocked. These are the two historical
// account-switch RED tests, now proven GREEN against real semantics.
vi.mock('@/lib/api', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    createCabinet: vi.fn(),
    getCabinetCreationOperation: vi.fn(),
  }
})
vi.mock('@/lib/api/cabinet', () => ({
  getCabinetTaxSettings: vi.fn(),
  updateCabinetTaxSettings: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }))
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

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

const createResponse = (suffix: string): CreateCabinetResponse => ({
  id: `cabinet-${suffix}`,
  name: `Cabinet ${suffix}`,
  isActive: true,
  createdAt: '2025-01-12T10:00:00Z',
  updatedAt: '2025-01-12T10:00:00Z',
  newToken: `jwt-${suffix}-new`,
  operationId: `op-${suffix}`,
  status: 'succeeded',
})

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, reject, resolve }
}

describe('CabinetCreationForm account-switch against REAL 167.9 settlement', () => {
  let queryClient: QueryClient
  const push = vi.fn()

  // login() (not setState) so each account gets a FRESH sessionNonce — the
  // real settlement predicate. Re-login of the same account is a new session.
  const loginAccount = (id: string, cabinetId: string | null = null) => {
    act(() => {
      useAuthStore
        .getState()
        .login({ id, email: `${id}@test.local`, role: 'Manager' } as never, `jwt-${id}`, cabinetId)
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

  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    vi.clearAllMocks()
    vi.mocked(createCabinet).mockReset()
    vi.mocked(getCabinetCreationOperation).mockReset()
    vi.mocked(getCabinetTaxSettings).mockResolvedValue(existingCabinet)
    vi.mocked(updateCabinetTaxSettings).mockResolvedValue(existingCabinet)
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false, gcTime: 0 },
      },
    })
    ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push })
    useAuthStore.setState({
      user: null,
      token: null,
      cabinetId: null,
      isAuthenticated: false,
      sessionNonce: null,
    })
    loginAccount('manager-a')
  })

  afterEach(() => {
    cleanup()
    queryClient.clear()
  })

  it('A→B→A switching with a held first POST produces no duplicate create (real settlement)', async () => {
    const heldA = deferred<CreateCabinetResponse>()
    const heldB = deferred<CreateCabinetResponse>()
    vi.mocked(createCabinet).mockReturnValueOnce(heldA.promise).mockReturnValueOnce(heldB.promise)
    vi.mocked(getCabinetCreationOperation).mockResolvedValue({
      operationId: 'op-held-a',
      status: 'in_progress',
      retryable: false,
    })

    const firstA = renderForm()
    await submitCreate('held-a')
    await waitFor(() => expect(createCabinet).toHaveBeenCalledTimes(1))

    loginAccount('manager-b')
    firstA.unmount()
    renderForm()
    await submitCreate('held-b')
    await waitFor(() => expect(createCabinet).toHaveBeenCalledTimes(2))

    // Back to A — a NEW session (fresh nonce), so A's own in-flight create is
    // now stale by real-settlement semantics.
    loginAccount('manager-a')
    await act(async () => heldA.resolve(createResponse('held-a')))
    await waitFor(() =>
      expect(getCabinetCreationOperation).toHaveBeenCalledWith('op-held-a', 'jwt-manager-a')
    )

    // Exactly one create per account lane — no duplicate POST from switching.
    expect(createCabinet).toHaveBeenCalledTimes(2)
    expect(toast.success).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()

    await act(async () => heldB.resolve(createResponse('held-b')))
    await waitFor(() =>
      expect(getCabinetCreationOperation).toHaveBeenCalledWith('op-held-b', 'jwt-manager-b')
    )
    // Neither the stale A nor the stale B settlement produced live-session UI effects.
    expect(toast.success).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
    expect(createCabinet).toHaveBeenCalledTimes(2)
  })

  it('stale A settlement (real service) never removes B recovery marker or B input', async () => {
    const heldA = deferred<CreateCabinetResponse>()
    const heldB = deferred<CreateCabinetResponse>()
    vi.mocked(createCabinet).mockReturnValueOnce(heldA.promise).mockReturnValueOnce(heldB.promise)

    const firstA = renderForm()
    await submitCreate('held-a')
    await waitFor(() => expect(createCabinet).toHaveBeenCalledTimes(1))

    loginAccount('manager-b')
    firstA.unmount()
    renderForm()
    await submitCreate('held-b')
    await waitFor(() => expect(createCabinet).toHaveBeenCalledTimes(2))

    const bKey = recoveryMarkerKey('manager-b')
    const bMarkerBefore = sessionStorage.getItem(bKey)
    expect(bMarkerBefore).not.toBeNull()

    // Resolve A's transport while B's session is live: the REAL service must
    // classify this stale (different session nonce) and the seam must keep B's
    // marker, B's input, and all UI effects suppressed.
    await act(async () => heldA.resolve(createResponse('held-a')))
    await waitFor(() =>
      expect(getCabinetCreationOperation).toHaveBeenCalledWith('op-held-a', 'jwt-manager-a')
    )

    expect(sessionStorage.getItem(bKey)).toBe(bMarkerBefore)
    expect(sessionStorage.getItem(recoveryMarkerKey('manager-a'))).not.toBeNull()
    expect(push).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/название кабинета/i)).toHaveValue('held-b')

    // B's own create is still the live session here — real settlement applies:
    // B's marker is cleared BY B's own success, and only B's effects fire.
    await act(async () => heldB.resolve(createResponse('held-b')))
    await waitFor(() => expect(sessionStorage.getItem(bKey)).toBeNull())
    await waitFor(() => expect(push).toHaveBeenCalledWith('/wb-token'))
    expect(toast.success).toHaveBeenCalledTimes(1)
    expect(createCabinet).toHaveBeenCalledTimes(2)
    // A's durable marker survives B's success — it belongs to another account.
    expect(sessionStorage.getItem(recoveryMarkerKey('manager-a'))).not.toBeNull()
  })
})
