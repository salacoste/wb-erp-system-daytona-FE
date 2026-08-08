/**
 * QuestionWriteControls component tests (NEW-2 PR2 fast-follow).
 *
 * Mirrors FeedbackWriteControls/PinnedWriteControls: the 202→poll→terminal UX
 * for answering a question (deterministic jobId). Covers loading/disabled
 * states, submit→202→poll→completed success toast + read-query invalidation,
 * 403 kill-switch → RU disabled message, failed → error toast, AND the
 * terminal('timeout', …) → WRITEBACK_TIMEOUT_MESSAGE toast (the answer-action
 * timeout toast was previously unasserted anywhere). Hooks mocked at the
 * boundary (AP#4); ApiError is the REAL class (AP#3). No `as`/`any`.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { ApiError } from '@/types/api'
import { QuestionWriteControls } from '../QuestionWriteControls'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mutateMock = vi.fn()
const invalidateMock = vi.fn()
let mutateError: unknown = null
let mutateIsPending = false

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: invalidateMock }),
}))

vi.mock('@/hooks/useCommunicationsWriteback', () => ({
  useAnswerQuestion: () => ({
    mutate: mutateMock,
    isPending: mutateIsPending,
    isError: mutateError != null,
    error: mutateError,
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

describe('QuestionWriteControls', () => {
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

  it('shows the Ответить button for an unanswered question', () => {
    render(<QuestionWriteControls questionId="2001" existingAnswer={null} />)
    expect(screen.getByTestId('question-answer-btn')).toBeInTheDocument()
  })

  it('shows Редактировать when an existing answer is present', () => {
    render(<QuestionWriteControls questionId="2001" existingAnswer="старый ответ" />)
    expect(screen.getByTestId('question-edit-btn')).toBeInTheDocument()
  })

  it('submit → mutate fires; on terminal completed → success toast + invalidate', async () => {
    const { toast } = await import('sonner')
    render(<QuestionWriteControls questionId="2001" existingAnswer={null} />)
    fireEvent.click(screen.getByTestId('question-answer-btn'))
    const textarea = await screen.findByTestId('reply-textarea')
    fireEvent.change(textarea, { target: { value: 'да' } })
    fireEvent.click(screen.getByTestId('reply-submit'))
    expect(mutateMock).toHaveBeenCalledTimes(1)
    // Simulate the 202→poll→terminal transition firing the coordinator callback.
    capturedTerminal?.('completed', null, { actionKind: 'answer_question' })
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Ответ отправлен')
    })
    expect(invalidateMock).toHaveBeenCalled()
  })

  it('403 kill-switch → renders the RU "Ответы отключены…" message', () => {
    mutateError = new ApiError('disabled', 403)
    render(<QuestionWriteControls questionId="2001" existingAnswer={null} />)
    expect(screen.getByTestId('question-writeback-status')).toHaveTextContent(
      'Ответы отключены — включите write-back в настройках сервера'
    )
  })

  it('non-403 error → renders the RU generic message (never raw BE/English)', () => {
    mutateError = new Error('Network error')
    render(<QuestionWriteControls questionId="2001" existingAnswer={null} />)
    expect(screen.getByTestId('question-writeback-status')).toHaveTextContent(
      'Не удалось отправить. Попробуйте ещё раз'
    )
  })

  it('terminal failed → error toast + no invalidation', async () => {
    const { toast } = await import('sonner')
    render(<QuestionWriteControls questionId="2001" existingAnswer={null} />)
    fireEvent.click(screen.getByTestId('question-answer-btn'))
    const textarea = await screen.findByTestId('reply-textarea')
    fireEvent.change(textarea, { target: { value: 'да' } })
    fireEvent.click(screen.getByTestId('reply-submit'))
    capturedTerminal?.('failed', 'WB rejected', { actionKind: 'answer_question' })
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Не удалось отправить ответ')
    })
    expect(invalidateMock).not.toHaveBeenCalled()
  })

  it('terminal timeout → RU timeout toast (the answer-action timeout, previously unasserted)', async () => {
    // Pass-2 P2-1: a poll timeout surfaces the RU timeout copy via toast — the
    // answer-action timeout toast was not asserted anywhere before this test.
    const { toast } = await import('sonner')
    render(<QuestionWriteControls questionId="2001" existingAnswer={null} />)
    capturedTerminal?.('timeout', null, { actionKind: 'answer_question' })
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Не удалось проверить статус отправки. Попробуйте ещё раз'
      )
    )
    expect(invalidateMock).not.toHaveBeenCalled()
  })
})
