/**
 * MSW handlers for NEW-2 Communications write-side (PR2).
 *
 * Mocks the six gated write endpoints (each returns 202 `{ jobId, status }`)
 * + the job-poll endpoint. State edges driven by `?mode=` query for unit/component
 * tests:
 *   - default            → 202 `{ jobId: 'job-1', status: 'waiting' }`
 *   - ?mode=disabled     → 403 (kill-switch: write-back disabled / not armed)
 *   - ?mode=error        → 500 (generic server error — non-2xx non-403)
 *
 * The job-poll endpoint returns a controllable sequence keyed by `?mode=`:
 *   - default            → `{ status: 'completed', result: null, error: null }`
 *   - ?mode=active       → `{ status: 'active', ... }` (keeps polling)
 *   - ?mode=failed       → `{ status: 'failed', result: null, error: 'WB rejected' }`
 *
 * Reference: src/communications/controllers/communications-writeback-*.controller.ts.
 */

import { http, HttpResponse, delay } from 'msw'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/** Default 202 enqueued body (BullMQ state at enqueue time). */
export const MOCK_WRITEBACK_ENQUEUED = { jobId: 'job-1', status: 'waiting' }

/** Default terminal-completed job snapshot. */
export const MOCK_WRITEBACK_JOB_COMPLETED = {
  jobId: 'job-1',
  status: 'completed',
  result: null,
  error: null,
}

/** Active (still polling) job snapshot. */
export const MOCK_WRITEBACK_JOB_ACTIVE = {
  jobId: 'job-1',
  status: 'active',
  result: null,
  error: null,
}

/** Failed terminal job snapshot. */
export const MOCK_WRITEBACK_JOB_FAILED = {
  jobId: 'job-1',
  status: 'failed',
  result: null,
  error: 'WB rejected',
}

/** True when the request body's confirmationToken is present (the 3rd gate factor). */
async function hasConfirmationToken(request: Request): Promise<boolean> {
  try {
    const body = (await request.clone().json()) as { confirmationToken?: unknown }
    return typeof body.confirmationToken === 'string' && body.confirmationToken.length > 0
  } catch {
    return false
  }
}

/**
 * Resolve a write request: 403 when ?mode=disabled, 500 when ?mode=error,
 * otherwise 202 with the enqueued body. Honors the presence-only token check
 * (missing token → 403, mirroring the BE assertWritablePublic gate). All six
 * write endpoints return 202 on success (Pass-2 P2-6: the always-202 status is
 * inlined here — no caller needs to pass it).
 */
async function resolveWrite(request: Request): Promise<Response> {
  await delay(20)
  const url = new URL(request.url)
  const mode = url.searchParams.get('mode')
  if (mode === 'disabled') {
    return HttpResponse.json({ message: 'Communications write-back disabled' }, { status: 403 })
  }
  if (mode === 'error') {
    return HttpResponse.json({ message: 'Server error' }, { status: 500 })
  }
  if (!(await hasConfirmationToken(request))) {
    return HttpResponse.json({ message: 'Missing confirmationToken' }, { status: 403 })
  }
  return HttpResponse.json(MOCK_WRITEBACK_ENQUEUED, { status: 202 })
}

export const communicationsWritebackHandlers = [
  // POST /v1/communications/feedbacks/:feedbackId/reply → 202 (one-shot)
  http.post(`${API_BASE_URL}/v1/communications/feedbacks/:feedbackId/reply`, ({ request }) =>
    resolveWrite(request)
  ),

  // PATCH /v1/communications/feedbacks/:feedbackId/reply → 202 (one-shot edit)
  http.patch(`${API_BASE_URL}/v1/communications/feedbacks/:feedbackId/reply`, ({ request }) =>
    resolveWrite(request)
  ),

  // POST /v1/communications/questions/:questionId/answer → 202 (deterministic)
  http.post(`${API_BASE_URL}/v1/communications/questions/:questionId/answer`, ({ request }) =>
    resolveWrite(request)
  ),

  // POST /v1/communications/chats/messages → 202 (deterministic dedup)
  http.post(`${API_BASE_URL}/v1/communications/chats/messages`, ({ request }) =>
    resolveWrite(request)
  ),

  // POST /v1/communications/feedbacks/:feedbackId/pin → 202 (one-shot)
  http.post(`${API_BASE_URL}/v1/communications/feedbacks/:feedbackId/pin`, ({ request }) =>
    resolveWrite(request)
  ),

  // DELETE /v1/communications/feedbacks/:feedbackId/pin → 202 (one-shot)
  http.delete(`${API_BASE_URL}/v1/communications/feedbacks/:feedbackId/pin`, ({ request }) =>
    resolveWrite(request)
  ),

  // GET /v1/communications/writeback/jobs/:jobId → controllable sequence via ?mode=
  http.get(`${API_BASE_URL}/v1/communications/writeback/jobs/:jobId`, async ({ request }) => {
    await delay(10)
    const mode = new URL(request.url).searchParams.get('mode')
    if (mode === 'active') return HttpResponse.json(MOCK_WRITEBACK_JOB_ACTIVE)
    if (mode === 'failed') return HttpResponse.json(MOCK_WRITEBACK_JOB_FAILED)
    return HttpResponse.json(MOCK_WRITEBACK_JOB_COMPLETED)
  }),
]
