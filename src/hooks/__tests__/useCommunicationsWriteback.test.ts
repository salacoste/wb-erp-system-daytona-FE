/**
 * NEW-2 write-side hook tests (PR2).
 *
 * Covers the six mutations (success 202, 403 kill-switch, network error) and the
 * poll query (stops on terminal, keeps polling on active). ApiError is the REAL
 * class (AP#3 — never fake ApiError). Error mocks use mockRejectedValueOnce
 * (AP#4-error-pattern). The api module is mocked with vi.mock (the hook holds an
 * ESM binding that spyOn can't reliably intercept under vitest's transform).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { ApiError } from '@/types/api'
import {
  useReplyFeedback,
  useUpdateFeedbackReply,
  useAnswerQuestion,
  useSendChatMessage,
  usePinFeedback,
  useUnpinFeedback,
  usePollWritebackJob,
  MAX_POLL_MS,
} from '../useCommunicationsWriteback'
import type { WritebackJobEnqueued } from '@/types/communications/writeback'

// vi.mock factories are hoisted ABOVE top-level consts, so the mock fns must be
// created inside vi.hoisted (otherwise "Cannot access 'X' before initialization").
const mocks = vi.hoisted(() => ({
  reply: vi.fn(),
  update: vi.fn(),
  answer: vi.fn(),
  send: vi.fn(),
  pin: vi.fn(),
  unpin: vi.fn(),
  status: vi.fn(),
}))

vi.mock('@/lib/api/communications-writeback', () => ({
  replyFeedback: mocks.reply,
  updateFeedbackReply: mocks.update,
  answerQuestion: mocks.answer,
  sendChatMessage: mocks.send,
  pinFeedback: mocks.pin,
  unpinFeedback: mocks.unpin,
  getWritebackJobStatus: mocks.status,
}))

const {
  reply: replyMock,
  update: updateMock,
  answer: answerMock,
  send: sendMock,
  pin: pinMock,
  unpin: unpinMock,
  status: statusMock,
} = mocks

/**
 * The confirmationToken is PRESENCE-ONLY (a fresh crypto.randomUUID per gesture)
 * — the contract guarantees a non-empty string, never a fixed value. Assertions
 * therefore use `expect.any(String)` (not a pinned UUID) so the test reflects the
 * real token-rotation contract rather than a brittle mock value.
 */
const TOKEN = expect.any(String)

const ENQUEUED: WritebackJobEnqueued = { jobId: 'job-1', status: 'waiting' }

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('NEW-2 write-side mutations', () => {
  beforeEach(() => {
    ;[replyMock, updateMock, answerMock, sendMock, pinMock, unpinMock, statusMock].forEach(m =>
      m.mockReset()
    )
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('useReplyFeedback resolves on 202 and mints a confirmation token', async () => {
    replyMock.mockResolvedValueOnce(ENQUEUED)
    const { result } = renderHook(() => useReplyFeedback(), { wrapper: createWrapper() })
    await act(async () => {
      result.current.mutate({ feedbackId: '1001', text: 'Спасибо!' })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(ENQUEUED)
    expect(replyMock).toHaveBeenCalledWith('1001', { text: 'Спасибо!' }, TOKEN)
  })

  it('useReplyFeedback surfaces 403 kill-switch as an ApiError(.status===403)', async () => {
    replyMock.mockRejectedValueOnce(new ApiError('disabled', 403))
    const { result } = renderHook(() => useReplyFeedback(), { wrapper: createWrapper() })
    await act(async () => {
      result.current.mutate({ feedbackId: '1001', text: 'hi' })
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ApiError)
    expect((result.current.error as ApiError).status).toBe(403)
  })

  it('useReplyFeedback surfaces a network error (non-403)', async () => {
    replyMock.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useReplyFeedback(), { wrapper: createWrapper() })
    await act(async () => {
      result.current.mutate({ feedbackId: '1001', text: 'hi' })
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('useUpdateFeedbackReply fires the PATCH edit', async () => {
    updateMock.mockResolvedValueOnce(ENQUEUED)
    const { result } = renderHook(() => useUpdateFeedbackReply(), { wrapper: createWrapper() })
    await act(async () => {
      result.current.mutate({ feedbackId: '1001', text: 'edited' })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(updateMock).toHaveBeenCalledWith('1001', { text: 'edited' }, TOKEN)
  })

  it('useAnswerQuestion forwards answer/status/wasViewed', async () => {
    answerMock.mockResolvedValueOnce(ENQUEUED)
    const { result } = renderHook(() => useAnswerQuestion(), { wrapper: createWrapper() })
    await act(async () => {
      result.current.mutate({ questionId: '2001', answer: 'да', status: 0, wasViewed: true })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(answerMock).toHaveBeenCalledWith(
      '2001',
      { answer: 'да', status: 0, wasViewed: true },
      TOKEN
    )
  })

  it('useSendChatMessage forwards replySign + message', async () => {
    sendMock.mockResolvedValueOnce(ENQUEUED)
    const { result } = renderHook(() => useSendChatMessage(), { wrapper: createWrapper() })
    await act(async () => {
      result.current.mutate({ replySign: 'sign-1', message: 'hello' })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(sendMock).toHaveBeenCalledWith({ replySign: 'sign-1', message: 'hello' }, TOKEN)
  })

  it('usePinFeedback forwards the { id } pinData', async () => {
    pinMock.mockResolvedValueOnce(ENQUEUED)
    const { result } = renderHook(() => usePinFeedback(), { wrapper: createWrapper() })
    await act(async () => {
      result.current.mutate({ feedbackId: '1001', pinData: { id: '1001' } })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(pinMock).toHaveBeenCalledWith('1001', { pinData: { id: '1001' } }, TOKEN)
  })

  it('useUnpinFeedback forwards the { id } unpinData', async () => {
    unpinMock.mockResolvedValueOnce(ENQUEUED)
    const { result } = renderHook(() => useUnpinFeedback(), { wrapper: createWrapper() })
    await act(async () => {
      result.current.mutate({ feedbackId: '1001', unpinData: { id: '1001' } })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(unpinMock).toHaveBeenCalledWith('1001', { unpinData: { id: '1001' } }, TOKEN)
  })
})

describe('usePollWritebackJob', () => {
  beforeEach(() => statusMock.mockReset())
  afterEach(() => vi.clearAllMocks())

  it('stops polling once the job reaches a terminal completed state', async () => {
    statusMock.mockResolvedValue({
      jobId: 'job-1',
      status: 'completed',
      result: null,
      error: null,
    })
    // Finding 9: interval=30 so a keep-polling regression would actually refetch
    // within the 60ms settle window (the default 1500ms would hide the bug).
    const { result } = renderHook(() => usePollWritebackJob('job-1', { interval: 30 }), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isTerminal).toBe(true))
    expect(result.current.data?.status).toBe('completed')
    // No further refetch after terminal (refetchInterval → false).
    const after = statusMock.mock.calls.length
    await new Promise(r => setTimeout(r, 60))
    expect(statusMock.mock.calls.length).toBe(after)
  })

  it('keeps polling while the job is active', async () => {
    statusMock.mockResolvedValue({ jobId: 'job-1', status: 'active', result: null, error: null })
    renderHook(() => usePollWritebackJob('job-1', { interval: 30 }), { wrapper: createWrapper() })
    await waitFor(() => expect(statusMock.mock.calls.length).toBeGreaterThanOrEqual(2))
  })

  it('is disabled when jobId is null (no fetch)', () => {
    const { result } = renderHook(() => usePollWritebackJob(null), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(false)
    expect(statusMock).not.toHaveBeenCalled()
  })

  it('times out (terminal) when the poll exceeds MAX_POLL_MS without a BullMQ terminal', async () => {
    // Pass-2 P2-1: the deadline must surface a terminal timeout so the submit
    // button re-enables + the RU timeout copy shows. Status stays 'active' so the
    // poll would otherwise spin forever — the deadline flips timedOut + stops it.
    vi.useFakeTimers()
    try {
      statusMock.mockResolvedValue({
        jobId: 'job-1',
        status: 'active',
        result: null,
        error: null,
      })
      const { result } = renderHook(() => usePollWritebackJob('job-1', { interval: 30 }), {
        wrapper: createWrapper(),
      })
      // Advance fake time + flush microtasks past MAX_POLL_MS. refetchInterval
      // reads Date.now() against the captured startedAt ref after each fetch
      // settles; advancing in steps lets each poll cycle settle so the deadline
      // check runs against a current Date.now() and flips timedOut.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(MAX_POLL_MS + 1000)
      })
      expect(result.current.timedOut).toBe(true)
      expect(result.current.isTerminal).toBe(true)
      expect(result.current.effectiveStatus).toBe('timeout')
      // Polling STOPPED: the status mock call count must not keep growing after
      // the deadline flipped the poll to terminal (refetchInterval → false).
      const after = statusMock.mock.calls.length
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_000)
      })
      expect(statusMock.mock.calls.length).toBe(after)
    } finally {
      vi.useRealTimers()
    }
  })
})
