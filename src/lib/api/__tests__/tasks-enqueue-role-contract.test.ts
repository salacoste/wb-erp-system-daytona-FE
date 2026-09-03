/**
 * Story 174.4 — G2 contract probe: POST /v1/tasks/enqueue wire + role gate.
 *
 * There is no dedicated tasks api-module — the real call sites (useSanityCheck,
 * useManualMarginRecalculation, useMoyskladSync) build the body inline and post
 * through the shared apiClient. This test mirrors useSanityCheck's exact
 * mutationFn shape and pins the wire contract at that boundary via MSW:
 *
 *  (a) Manager token → 200; body carries task_type + payload{cabinet_id};
 *      X-Cabinet-Id + Authorization headers are auto-injected.
 *  (b) Analyst token → BE RolesGuard answers 403; the client surfaces a REAL
 *      ApiError(.status === 403) (anti-pattern #3: real constructor) and fires
 *      exactly ONE request — no retry storm (apiClient never auto-retries).
 *
 * No `as`/`any`; unhandled MSW requests error out.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { apiClient } from '@/lib/api-client'
import { ApiError } from '@/types/api'
import type { EnqueueTaskResponse, SanityCheckPayload } from '@/types/tasks'
import { setupMockAuth, clearMockAuth } from '@/test/test-utils'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const ENQUEUE_URL = `${API}/v1/tasks/enqueue`

/**
 * Byte-for-byte mirror of useSanityCheck's enqueue mutationFn (the canonical
 * call-site shape for /v1/tasks/enqueue): task_type + payload with cabinet_id.
 */
function enqueueWeeklySanityCheck(week?: string): Promise<EnqueueTaskResponse> {
  const payload: SanityCheckPayload & { cabinet_id: string } = { cabinet_id: 'cab-771' }
  if (week) payload.week = week
  return apiClient.post<EnqueueTaskResponse>('/v1/tasks/enqueue', {
    task_type: 'weekly_sanity_check',
    payload,
  })
}

interface EnqueueCapture {
  url: string
  body: Record<string, unknown>
  authHeader: string
  cabinetHeader: string
  contentType: string
}

/** Type-guard: a JSON object value (no `as` casts). */
function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Guard-narrowed JSON object read (no `as` casts). */
async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const parsed: unknown = await request.clone().json()
  if (!isJsonObject(parsed)) {
    throw new Error('Expected a JSON object body on the enqueue request')
  }
  return parsed
}

/**
 * Install a role-aware enqueue handler mirroring the BE contract
 * (JwtAuthGuard + RolesGuard: Owner/Manager/Service → 201/200, Analyst → 403).
 * Role is keyed on the token string the test injects into the auth store.
 */
function useRoleAwareEnqueueHandler(
  captures: EnqueueCapture[],
  respond: (token: string) => Response
): void {
  server.use(
    http.post(ENQUEUE_URL, async ({ request }) => {
      const authHeader = request.headers.get('Authorization') ?? ''
      captures.push({
        url: request.url,
        body: await readJsonObject(request),
        authHeader,
        cabinetHeader: request.headers.get('X-Cabinet-Id') ?? '',
        contentType: request.headers.get('Content-Type') ?? '',
      })
      return respond(authHeader.replace('Bearer ', ''))
    })
  )
}

afterEach(() => {
  clearMockAuth()
})

describe('G2 — /v1/tasks/enqueue wire + role contract (MSW, real apiClient)', () => {
  it('Manager token → 200 with task_type + payload + cabinet header', async () => {
    const captures: EnqueueCapture[] = []
    useRoleAwareEnqueueHandler(captures, token => {
      if (token === 'analyst-jwt') {
        return HttpResponse.json({ message: 'Analyst role cannot enqueue tasks' }, { status: 403 })
      }
      return HttpResponse.json({
        task_uuid: 'task-uuid-9f1c',
        status: 'pending',
        enqueued_at: '2026-09-01T10:00:00Z',
      })
    })

    setupMockAuth({ token: 'manager-jwt', cabinetId: 'cab-771' })

    const response = await enqueueWeeklySanityCheck('2026-W35')

    // The client unwrapped the 200 body into the EnqueueTaskResponse shape.
    expect(response.task_uuid).toBe('task-uuid-9f1c')
    expect(response.status).toBe('pending')

    // Exactly one request — deterministic single-shot enqueue.
    expect(captures).toHaveLength(1)
    const capture = captures[0]

    // Wire body contract: task_type string + payload{cabinet_id[, week]}.
    expect(capture.body.task_type).toBe('weekly_sanity_check')
    const payload: unknown = capture.body.payload
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('Expected payload object on the enqueue wire body')
    }
    expect(payload).toEqual({ cabinet_id: 'cab-771', week: '2026-W35' })

    // Auto-injected auth context headers.
    expect(capture.authHeader).toBe('Bearer manager-jwt')
    expect(capture.cabinetHeader).toBe('cab-771')
    expect(capture.contentType).toContain('application/json')
    expect(capture.url).toBe(ENQUEUE_URL)
  })

  it('Analyst token → real ApiError(403), exactly ONE request (no retry storm)', async () => {
    const captures: EnqueueCapture[] = []
    useRoleAwareEnqueueHandler(captures, () =>
      HttpResponse.json({ message: 'Analyst role cannot enqueue tasks' }, { status: 403 })
    )

    setupMockAuth({ token: 'analyst-jwt', cabinetId: 'cab-771' })

    // AP#3: the rejection is a REAL ApiError instance (not an Object.assign fake)
    // so downstream instanceof/.status consumers keep working.
    let thrown: unknown
    try {
      await enqueueWeeklySanityCheck()
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(ApiError)
    const apiError = thrown instanceof ApiError ? thrown : null
    expect(apiError?.status).toBe(403)
    expect(apiError?.message).toBe('Analyst role cannot enqueue tasks')

    // No retry storm: the client fired exactly one enqueue request for the 403.
    expect(captures).toHaveLength(1)
    expect(captures[0].authHeader).toBe('Bearer analyst-jwt')
    expect(captures[0].cabinetHeader).toBe('cab-771')
  })
})
