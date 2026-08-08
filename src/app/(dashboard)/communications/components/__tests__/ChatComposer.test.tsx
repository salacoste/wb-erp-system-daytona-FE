/**
 * ChatComposer component tests (NEW-2 PR2).
 *
 * Covers: send disabled when replySign missing; send → mutate → terminal success
 * toast + invalidate; 403 → kill-switch RU message. ApiError is the REAL class
 * (AP#3); hooks mocked at the boundary with `as unknown as ReturnType<typeof vi.fn>`
 * (AP#4).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { ApiError } from '@/types/api'
import { ChatComposer } from '../ChatComposer'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const sendMock = vi.fn()
const invalidateMock = vi.fn()
let sendError: unknown = null
let capturedTerminal:
  | ((status: string, error: string | null | undefined, m: { actionKind: string | null }) => void)
  | null = null

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: invalidateMock }),
}))

vi.mock('@/hooks/useCommunicationsWriteback', () => ({
  useSendChatMessage: () => ({
    mutate: sendMock,
    isPending: false,
    isError: sendError != null,
    error: sendError,
  }),
  WRITEBACK_TIMEOUT_MESSAGE: 'Не удалось проверить статус отправки. Попробуйте ещё раз',
  WRITEBACK_TIMEOUT_STATUS: 'timeout',
}))

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

describe('ChatComposer', () => {
  beforeEach(() => {
    sendMock.mockReset()
    invalidateMock.mockReset()
    sendError = null
    capturedTerminal = null
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('disables send when replySign is null (no crash)', () => {
    render(<ChatComposer replySign={null} />)
    expect(screen.getByTestId('chat-send-btn')).toBeDisabled()
    expect(screen.getByTestId('chat-message-textarea')).toBeDisabled()
  })

  it('send → mutate fires with replySign + message; terminal → success toast + invalidate', async () => {
    const { toast } = await import('sonner')
    render(<ChatComposer replySign="sign-1" />)
    fireEvent.change(screen.getByTestId('chat-message-textarea'), { target: { value: 'hello' } })
    fireEvent.click(screen.getByTestId('chat-send-btn'))
    expect(sendMock).toHaveBeenCalledWith(
      { replySign: 'sign-1', message: 'hello' },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )
    capturedTerminal?.('completed', null, { actionKind: 'send_chat' })
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Сообщение отправлено'))
    expect(invalidateMock).toHaveBeenCalled()
  })

  it('403 → renders the RU kill-switch message', () => {
    sendError = new ApiError('disabled', 403)
    render(<ChatComposer replySign="sign-1" />)
    expect(screen.getByTestId('chat-writeback-status')).toHaveTextContent(
      'Ответы отключены — включите write-back в настройках сервера'
    )
  })
})
