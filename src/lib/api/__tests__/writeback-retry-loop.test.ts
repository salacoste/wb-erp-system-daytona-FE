/**
 * Story 174.4 — G3 contract probe: writeback retry loop (PATCH path).
 *
 * Extends the communications-writeback-msw.test.ts pattern with the RETRY
 * contract on `updateFeedbackReply`
 * (PATCH /v1/communications/feedbacks/:feedbackId/reply):
 *
 *   attempt 1 → HTTP 500 (WB upstream blip) → the client EXPOSES the error
 *   state as a real ApiError(.status === 500) — nothing is masked/queued;
 *   retry   → the SAME exact request body re-traverses the real apiClient
 *   → fetch → MSW (byte-identical: string diff AND parsed deep-equal = zero
 *   drift) → 202 { jobId, status } resolves.
 *
 * Defensive-frontend: the API module does not silently retry or mutate the
 * body between attempts — the caller re-issues the identical gesture payload.
 *
 * No `as`/`any`; real MSW interception (unhandled requests error out).
 */

import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { ApiError } from '@/types/api'
import { updateFeedbackReply } from '../communications-writeback'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const REPLY_URL = `${API}/v1/communications/feedbacks/1001/reply`

/** Type-guard: a JSON object value (no `as` casts). */
function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Guard-narrowed JSON object read (no `as` casts). */
async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const parsed: unknown = await request.clone().json()
  if (!isJsonObject(parsed)) {
    throw new Error('Expected a JSON object body on the reply writeback request')
  }
  return parsed
}

describe('G3 — writeback retry loop: 500 → error state → identical retry → 202', () => {
  it('re-sends the SAME exact body after a 500 and resolves on 202', async () => {
    const rawBodies: string[] = []
    const parsedBodies: Array<Record<string, unknown>> = []
    const methods: string[] = []
    let patchCount = 0

    // First PATCH → 500 (transient upstream failure); every later PATCH → 202.
    server.use(
      http.patch(REPLY_URL, async ({ request }) => {
        patchCount += 1
        methods.push(request.method)
        rawBodies.push(await request.clone().text())
        parsedBodies.push(await readJsonObject(request))
        if (patchCount === 1) {
          return HttpResponse.json({ message: 'WB upstream unavailable' }, { status: 500 })
        }
        return HttpResponse.json({ jobId: 'job-retry-1', status: 'waiting' }, { status: 202 })
      })
    )

    // The user gesture payload — identical args on BOTH attempts (the hook
    // rotates confirmationToken per gesture; one gesture = one token = both
    // wire attempts of that gesture carry it unchanged).
    const args = { text: 'Ответ продавца на отзыв' }
    const token = 'tok-gesture-uuid-1'

    // Attempt 1: the client exposes the failure — real ApiError(500), not a
    // silent swallow, not a masked fallback value.
    let firstError: unknown
    try {
      await updateFeedbackReply('1001', args, token)
    } catch (error) {
      firstError = error
    }
    expect(firstError).toBeInstanceOf(ApiError)
    const apiError = firstError instanceof ApiError ? firstError : null
    expect(apiError?.status).toBe(500)
    expect(apiError?.message).toBe('WB upstream unavailable')

    // The failed attempt already carried the full write contract on the wire.
    expect(patchCount).toBe(1)
    expect(methods[0]).toBe('PATCH')
    expect(parsedBodies[0]).toEqual({ text: args.text, confirmationToken: token })

    // Attempt 2 (caller retry of the same gesture): 202 resolves.
    const enqueued = await updateFeedbackReply('1001', args, token)
    expect(enqueued).toEqual({ jobId: 'job-retry-1', status: 'waiting' })

    // Retry-loop wire contract: exactly two requests, ZERO body drift —
    // byte-identical raw serialization AND deep-equal parsed payloads.
    expect(patchCount).toBe(2)
    expect(methods).toEqual(['PATCH', 'PATCH'])
    expect(rawBodies[1]).toBe(rawBodies[0])
    expect(parsedBodies[1]).toEqual(parsedBodies[0])
  })
})
