/**
 * PinnedWriteControls component tests (NEW-2 PR2).
 *
 * Covers the two-click confirm → pin/unpin flow: open dialog, confirm → mutate
 * fires → terminal completed → success toast + invalidate. 403 → kill-switch RU
 * message; null feedbackId → buttons disabled (no crash). ApiError is the REAL
 * class (AP#3); hooks mocked at the boundary (AP#4).
 *
 * Post-review: pin + unpin use SEPARATE coordinators (Finding 5); onTerminal
 * carries a meta with the action captured at fire time so the toast verb is
 * driven by actionKind, not the current dialog state.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react'
import { ApiError } from '@/types/api'
import { PinnedWriteControls } from '../PinnedWriteControls'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const pinMock = vi.fn()
const unpinMock = vi.fn()
const invalidateMock = vi.fn()
let pinError: unknown = null
let unpinError: unknown = null

/** Shape of the mocked useWritebackJob return (now incl. effectiveStatus). */
interface MockJob {
  jobId: string | null
  status: string | undefined
  effectiveStatus: string | undefined
  error: string | null | undefined
  isTerminal: boolean
  pollError: boolean
  setJobId: ReturnType<typeof vi.fn>
  setActionKind: ReturnType<typeof vi.fn>
  terminal:
    ((s: string, e: string | null | undefined, m: { actionKind: string | null }) => void) | null
}

// Two independent coordinators (Finding 5): pin + unpin each get their own.
let pinJob: MockJob
let unpinJob: MockJob

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: invalidateMock }),
}))

vi.mock('@/hooks/useCommunicationsWriteback', () => ({
  usePinFeedback: () => ({
    mutate: pinMock,
    isPending: false,
    isError: pinError != null,
    error: pinError,
  }),
  useUnpinFeedback: () => ({
    mutate: unpinMock,
    isPending: false,
    isError: unpinError != null,
    error: unpinError,
  }),
  WRITEBACK_TIMEOUT_MESSAGE: 'Не удалось проверить статус отправки. Попробуйте ещё раз',
  WRITEBACK_TIMEOUT_STATUS: 'timeout',
}))

vi.mock('@/hooks/useWritebackJob', () => ({
  useWritebackJob: (
    onTerminal: (s: string, e: string | null | undefined, m: { actionKind: string | null }) => void
  ) => {
    const job: MockJob = {
      jobId: null,
      status: undefined,
      effectiveStatus: undefined,
      error: null,
      isTerminal: false,
      pollError: false,
      setJobId: vi.fn(),
      setActionKind: vi.fn(),
      terminal: onTerminal,
    }
    // The first call is the pin coordinator, the second is unpin (render order).
    if (!pinJob) pinJob = job
    else if (!unpinJob) unpinJob = job
    return job
  },
}))

describe('PinnedWriteControls', () => {
  beforeEach(() => {
    pinMock.mockReset()
    unpinMock.mockReset()
    invalidateMock.mockReset()
    pinError = null
    unpinError = null
    pinJob = undefined as unknown as MockJob
    unpinJob = undefined as unknown as MockJob
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('disables buttons when feedbackId is null (no crash)', () => {
    render(<PinnedWriteControls feedbackId={null} />)
    expect(screen.getByTestId('pin-btn')).toBeDisabled()
    expect(screen.getByTestId('unpin-btn')).toBeDisabled()
  })

  it('confirm pin → mutate fires → terminal completed → success toast + invalidate', async () => {
    const { toast } = await import('sonner')
    render(<PinnedWriteControls feedbackId="1001" />)
    fireEvent.click(screen.getByTestId('pin-btn'))
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByText('Закрепить'))
    expect(pinMock).toHaveBeenCalledWith(
      { feedbackId: '1001', pinData: { id: '1001' } },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )
    pinJob.terminal?.('completed', null, { actionKind: 'pin' })
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Отзыв закреплён'))
    expect(invalidateMock).toHaveBeenCalled()
  })

  it('confirm unpin → mutate fires → terminal completed → unpin toast', async () => {
    const { toast } = await import('sonner')
    render(<PinnedWriteControls feedbackId="1001" />)
    fireEvent.click(screen.getByTestId('unpin-btn'))
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByText('Открепить'))
    expect(unpinMock).toHaveBeenCalledWith(
      { feedbackId: '1001', unpinData: { id: '1001' } },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )
    unpinJob.terminal?.('completed', null, { actionKind: 'unpin' })
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Отзыв откреплён'))
  })

  it('403 → renders the RU kill-switch message', () => {
    pinError = new ApiError('disabled', 403)
    render(<PinnedWriteControls feedbackId="1001" />)
    expect(screen.getByTestId('pinned-writeback-status')).toHaveTextContent(
      'Ответы отключены — включите write-back в настройках сервера'
    )
  })

  it('terminal timeout → RU timeout toast (distinct from the generic failure)', async () => {
    // Pass-2 P2-1: a poll timeout surfaces the RU timeout copy via toast (the
    // acceptance "a RU timeout message shows"). Pin terminal 'timeout' → the
    // timeout toast, NOT the generic "Не удалось изменить закрепление".
    const { toast } = await import('sonner')
    render(<PinnedWriteControls feedbackId="1001" />)
    pinJob.terminal?.('timeout', null, { actionKind: 'pin' })
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Не удалось проверить статус отправки. Попробуйте ещё раз'
      )
    )
    expect(invalidateMock).not.toHaveBeenCalled()
  })
})
