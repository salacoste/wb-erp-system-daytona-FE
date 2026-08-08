/**
 * NEW-2 writeback API-client tests (PR2).
 *
 * Verifies each of the 7 fns calls apiClient with the right method/endpoint/body.
 * Crucially locks the DELETE-with-body contract for unpinFeedback: apiClient.delete
 * forwards `options.body` to fetch (RequestInit), so the { unpinData, token } JSON
 * rides in options.body. Real ApiError on non-2xx (AP#3).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiError } from '@/types/api'
import { apiClient } from '@/lib/api-client'
import {
  replyFeedback,
  updateFeedbackReply,
  answerQuestion,
  sendChatMessage,
  pinFeedback,
  unpinFeedback,
  getWritebackJobStatus,
} from '../communications-writeback'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const apiMock = apiClient as unknown as ReturnType<typeof vi.fn> & {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  patch: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

describe('NEW-2 writeback API client', () => {
  beforeEach(() => {
    apiMock.post.mockReset()
    apiMock.patch.mockReset()
    apiMock.delete.mockReset()
    apiMock.get.mockReset()
  })

  it('replyFeedback POSTs text + token to /reply', async () => {
    apiMock.post.mockResolvedValueOnce({ jobId: 'j', status: 'waiting' })
    await replyFeedback('1001', { text: 'hi' }, 'tok')
    expect(apiMock.post).toHaveBeenCalledWith('/v1/communications/feedbacks/1001/reply', {
      text: 'hi',
      confirmationToken: 'tok',
    })
  })

  it('updateFeedbackReply PATCHes text + token to /reply', async () => {
    apiMock.patch.mockResolvedValueOnce({ jobId: 'j', status: 'waiting' })
    await updateFeedbackReply('1001', { text: 'edited' }, 'tok')
    expect(apiMock.patch).toHaveBeenCalledWith('/v1/communications/feedbacks/1001/reply', {
      text: 'edited',
      confirmationToken: 'tok',
    })
  })

  it('answerQuestion forwards only the provided optional fields', async () => {
    apiMock.post.mockResolvedValueOnce({ jobId: 'j', status: 'waiting' })
    await answerQuestion('2001', { answer: 'да', wasViewed: true }, 'tok')
    expect(apiMock.post).toHaveBeenCalledWith('/v1/communications/questions/2001/answer', {
      confirmationToken: 'tok',
      answer: 'да',
      wasViewed: true,
    })
  })

  it('sendChatMessage POSTs replySign + message', async () => {
    apiMock.post.mockResolvedValueOnce({ jobId: 'j', status: 'waiting' })
    await sendChatMessage({ replySign: 'sign', message: 'm' }, 'tok')
    expect(apiMock.post).toHaveBeenCalledWith('/v1/communications/chats/messages', {
      replySign: 'sign',
      message: 'm',
      confirmationToken: 'tok',
    })
  })

  it('pinFeedback POSTs pinData', async () => {
    apiMock.post.mockResolvedValueOnce({ jobId: 'j', status: 'waiting' })
    await pinFeedback('1001', { pinData: { id: '1001' } }, 'tok')
    expect(apiMock.post).toHaveBeenCalledWith('/v1/communications/feedbacks/1001/pin', {
      pinData: { id: '1001' },
      confirmationToken: 'tok',
    })
  })

  it('unpinFeedback DELETEs with the JSON body in options.body (DELETE-with-body)', async () => {
    apiMock.delete.mockResolvedValueOnce({ jobId: 'j', status: 'waiting' })
    await unpinFeedback('1001', { unpinData: { id: '1001' } }, 'tok')
    expect(apiMock.delete).toHaveBeenCalledWith('/v1/communications/feedbacks/1001/pin', {
      body: JSON.stringify({ unpinData: { id: '1001' }, confirmationToken: 'tok' }),
    })
  })

  it('getWritebackJobStatus GETs the job endpoint', async () => {
    apiMock.get.mockResolvedValueOnce({
      jobId: 'j',
      status: 'completed',
      result: null,
      error: null,
    })
    await getWritebackJobStatus('job-1')
    expect(apiMock.get).toHaveBeenCalledWith('/v1/communications/writeback/jobs/job-1')
  })

  it('propagates a real ApiError on a 403 (never swallows the kill-switch)', async () => {
    apiMock.post.mockRejectedValueOnce(new ApiError('disabled', 403))
    await expect(replyFeedback('1001', { text: 'hi' }, 'tok')).rejects.toThrow(ApiError)
  })
})
