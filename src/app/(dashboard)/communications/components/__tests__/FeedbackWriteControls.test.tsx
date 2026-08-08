/**
 * FeedbackWriteControls component tests (NEW-2 PR2).
 *
 * Covers the 202→poll→terminal UX:
 *   - success: reply → 202 → poll completed → success toast
 *   - 403 kill-switch → the RU "Ответы отключены…" message (not a generic crash)
 *   - error → generic RU error line
 * Hooks are mocked at the boundary; ApiError is the REAL class (AP#3); error
 * mocks use mockRejectedValueOnce (AP#4). No `as`/`any`.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { ApiError } from '@/types/api'
import { FeedbackWriteControls } from '../FeedbackWriteControls'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mutateMock = vi.fn()
const invalidateMock = vi.fn()
let mutateError: unknown = null
let mutateIsPending = false

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: invalidateMock }),
}))

vi.mock('@/hooks/useCommunicationsWriteback', () => ({
  useReplyFeedback: () => ({
    mutate: mutateMock,
    isPending: mutateIsPending,
    isError: mutateError != null,
    error: mutateError,
  }),
  useUpdateFeedbackReply: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
  WRITEBACK_TIMEOUT_MESSAGE: 'Не удалось проверить статус отправки. Попробуйте ещё раз',
  WRITEBACK_TIMEOUT_STATUS: 'timeout',
}))

// The coordinator: capture the jobId from the 202 and feed the terminal handler.
let capturedTerminal:
  | ((status: string, error: string | null | undefined, m: { actionKind: string | null }) => void)
  | null = null
vi.mock('@/hooks/useWritebackJob', () => ({
  useWritebackJob: (
    onTerminal: (s: string, e: string | null | undefined, m: { actionKind: string | null }) => void
  ) => {
    capturedTerminal = onTerminal
    return {
      jobId: null,
      status: undefined,
      effectiveStatus: undefined,
      error: null,
      isTerminal: false,
      pollError: false,
      setJobId: vi.fn(),
      setActionKind: vi.fn(),
    }
  },
}))

describe('FeedbackWriteControls', () => {
  beforeEach(() => {
    mutateMock.mockReset()
    invalidateMock.mockReset()
    mutateError = null
    mutateIsPending = false
    capturedTerminal = null
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('shows the Ответить button for an unanswered feedback', () => {
    render(<FeedbackWriteControls feedbackId="1001" existingAnswer={null} />)
    expect(screen.getByTestId('feedback-reply-btn')).toBeInTheDocument()
  })

  it('shows Редактировать when an existing answer is present', () => {
    render(<FeedbackWriteControls feedbackId="1001" existingAnswer="старый ответ" />)
    expect(screen.getByTestId('feedback-edit-btn')).toBeInTheDocument()
  })

  it('submit → mutate fires; on terminal completed → success toast + invalidate', async () => {
    const { toast } = await import('sonner')
    render(<FeedbackWriteControls feedbackId="1001" existingAnswer={null} />)
    fireEvent.click(screen.getByTestId('feedback-reply-btn'))
    const textarea = await screen.findByTestId('reply-textarea')
    fireEvent.change(textarea, { target: { value: 'Спасибо!' } })
    fireEvent.click(screen.getByTestId('reply-submit'))
    expect(mutateMock).toHaveBeenCalledTimes(1)
    // Simulate the 202→poll→terminal transition firing the coordinator callback.
    capturedTerminal?.('completed', null, { actionKind: 'reply_feedback' })
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Ответ отправлен')
    })
    expect(invalidateMock).toHaveBeenCalled()
  })

  it('403 kill-switch → renders the RU "Ответы отключены…" message', () => {
    mutateError = new ApiError('disabled', 403)
    render(<FeedbackWriteControls feedbackId="1001" existingAnswer={null} />)
    expect(screen.getByTestId('feedback-writeback-status')).toHaveTextContent(
      'Ответы отключены — включите write-back в настройках сервера'
    )
  })

  it('non-403 error → renders the RU generic message (never raw BE/English)', () => {
    mutateError = new Error('Network error')
    render(<FeedbackWriteControls feedbackId="1001" existingAnswer={null} />)
    expect(screen.getByTestId('feedback-writeback-status')).toHaveTextContent(
      'Не удалось отправить. Попробуйте ещё раз'
    )
  })

  it('terminal failed → error toast + no invalidation', async () => {
    const { toast } = await import('sonner')
    render(<FeedbackWriteControls feedbackId="1001" existingAnswer={null} />)
    fireEvent.click(screen.getByTestId('feedback-reply-btn'))
    const textarea = await screen.findByTestId('reply-textarea')
    fireEvent.change(textarea, { target: { value: 'hi' } })
    fireEvent.click(screen.getByTestId('reply-submit'))
    capturedTerminal?.('failed', 'WB rejected', { actionKind: 'reply_feedback' })
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Не удалось отправить ответ')
    })
    expect(invalidateMock).not.toHaveBeenCalled()
  })
})
