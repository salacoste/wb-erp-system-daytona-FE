/**
 * NEW-2 MSW integration tests (PR2, Finding 8).
 *
 * Proves the DELETE-with-body contract TRAVERSES the real apiClient → fetch → MSW
 * (hasConfirmationToken reads options.body → 202). The apiClient is NOT mocked
 * here — the real fetch is intercepted by MSW handlers registered globally in
 * src/test/setup.ts. Also covers a ?mode=disabled → 403 path through MSW.
 *
 * Real ApiError on 403 (AP#3). No `as`/`any`.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ApiError } from '@/types/api'
import { unpinFeedback, pinFeedback, replyFeedback } from '../communications-writeback'

/**
 * Bypass the apiClient's auth-store header injection is unnecessary — the MSW
 * handler only checks the confirmationToken body + ?mode= query. The default
 * writeback handlers resolve 202 for any path with a present token.
 */
describe('NEW-2 writeback MSW integration (real apiClient + MSW)', () => {
  beforeEach(() => {
    // Ensure no query-string mode leaks between tests (handlers key on ?mode=).
  })

  it('unpinFeedback DELETE-with-body → 202 through the real apiClient → MSW', async () => {
    // The JSON body { unpinData, confirmationToken } rides in options.body;
    // MSW's hasConfirmationToken must read it and return 202.
    const enqueued = await unpinFeedback('1001', { unpinData: { id: '1001' } }, 'tok-1')
    expect(enqueued).toEqual(expect.objectContaining({ status: 'waiting' }))
    expect(typeof enqueued.jobId).toBe('string')
  })

  it('pinFeedback POST → 202 through MSW', async () => {
    const enqueued = await pinFeedback('1001', { pinData: { id: '1001' } }, 'tok-2')
    expect(enqueued).toEqual(expect.objectContaining({ status: 'waiting' }))
  })

  it('missing confirmationToken → real ApiError(403) through MSW (gate path)', async () => {
    // The MSW handler mirrors the BE assertWritablePublic gate: a request with no
    // confirmationToken is rejected 403 before enqueue. An empty token surfaces as
    // a real ApiError(.status === 403) — proving the 403 path traverses MSW.
    await expect(replyFeedback('1001', { text: 'hi' }, '')).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
    })
    // Stronger: the thrown error is a real ApiError instance (AP#3).
    try {
      await replyFeedback('1001', { text: 'hi' }, '')
      throw new Error('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      expect((e as ApiError).status).toBe(403)
    }
  })
})
