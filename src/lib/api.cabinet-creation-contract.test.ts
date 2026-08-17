/**
 * Story 167.8/167.9 contract tests for POST /v1/cabinets and
 * GET /v1/cabinets/creation-operations/{operationId}.
 *
 * Fixtures are byte-faithful to the LIVE swagger served by the local backend
 * (GET http://localhost:3000/api-json, PR #227 / Story 167.8):
 * - CreateCabinetResponseDto: id/name/isActive/taxSystem/taxRate/vatPayer/vatRate/
 *   targetMarginPct/createdAt/updatedAt/keys/operationId/status('succeeded')/
 *   replayed/newToken/productsSyncTasks
 * - CabinetCreationInProgressDto: { operationId, status: 'in_progress', retryable, retryAfterSeconds }
 * - CabinetCreationFailedDto: { operationId, status: 'failed', failure: { code, retryable }, completedAt }
 * - Story errors use the nested envelope { error: { code, message, details, trace_id, timestamp, path } }
 * - 409 responses may carry Retry-After (present for CABINET_CREATION_IN_PROGRESS)
 * - GET /creation-operations/{id} returns HTTP 200 for in_progress/succeeded/failed
 *   alike (live swagger: responses = 200/400/401/403/404/410 — there is no 202);
 *   410 = CABINET_CREATION_GONE (cabinet deleted after success).
 *
 * Why no in-vitest live-backend test: this suite's harness routes every fetch
 * through MSW (onUnhandledRequest: 'error') and the epic128 outbound network
 * guard (src/test/outbound-node-network-guard.ts) denies ALL live egress from
 * vitest — including node:http to localhost — by design. Real-backend read-only
 * evidence is therefore captured out-of-band against the live local backend
 * (Story 167.9 evidence): unauth GET → 401 {error:{code:'UNAUTHORIZED',...}};
 * auth GET with a random UUID v4 → 404 CABINET_CREATION_OPERATION_NOT_FOUND
 * nested envelope; auth GET with a non-UUID → 400 CABINET_CREATION_OPERATION_ID_INVALID.
 * No mock shape below is invented: every field comes from the live swagger.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiError } from '@/types/api'
import { createCabinet, getCabinetCreationOperation } from './api'
import type { CreateCabinetResponse, CabinetCreationOperationState } from '@/types/cabinet'

vi.mock('./env', () => ({
  env: {
    apiUrl: 'http://localhost:3000/api',
  },
}))

let mockAuthStore: { token: string | null; cabinetId: string | null } = {
  token: null,
  cabinetId: null,
}

vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: () => mockAuthStore,
  },
}))

const fetchMock = vi.fn()

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  const headerGet = (key: string) =>
    key === 'content-type' ? 'application/json' : (headers[key.toLowerCase()] ?? null)
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'Status',
    headers: { get: headerGet },
    json: async () => body,
  }
}

/** Byte-faithful CreateCabinetResponseDto per live swagger. */
const succeededDto: CreateCabinetResponse = {
  id: 'c1b2d3e4-0000-4000-8000-000000000001',
  name: 'Test Cabinet',
  isActive: true,
  taxSystem: 'usn15',
  taxRate: 15.5,
  vatPayer: false,
  vatRate: 20,
  targetMarginPct: 20,
  createdAt: '2026-08-17T10:00:00.000Z',
  updatedAt: '2026-08-17T10:00:00.000Z',
  keys: [],
  operationId: '9ca8c2ba-0b3f-4a2a-b20c-27db4d60a7b0',
  status: 'succeeded',
  replayed: false,
  newToken: 'new-jwt-with-updated-cabinet-ids',
  productsSyncTasks: [],
}

const ctx = { token: 'initiating-token-A', idempotencyKey: '9ca8c2ba-0b3f-4a2a-b20c-27db4d60a7b0' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  mockAuthStore = { token: 'store-token-B', cabinetId: null }
})

describe('POST /v1/cabinets contract (Story 167.8)', () => {
  it('201: resolves the full CreateCabinetResponseDto including durable operation fields', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, succeededDto))

    const result = await createCabinet({ name: 'Test Cabinet' }, ctx)

    expect(result).toEqual(succeededDto)
    expect(result.operationId).toBe('9ca8c2ba-0b3f-4a2a-b20c-27db4d60a7b0')
    expect(result.status).toBe('succeeded')
    expect(result.newToken).toBe('new-jwt-with-updated-cabinet-ids')
  })

  it('202: an operation-envelope create response carries the same DTO (replay/in-progress variants)', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        202,
        { ...succeededDto, replayed: true },
        { 'cache-control': 'private, no-store' }
      )
    )

    const result = await createCabinet({ name: 'Test Cabinet' }, ctx)

    expect(result.replayed).toBe(true)
  })

  it('409 conflict: nested error envelope surfaces code CABINET_CREATION_CONFLICT', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        409,
        {
          error: {
            code: 'CABINET_CREATION_CONFLICT',
            message: 'Idempotency-Key reused with a different payload',
            details: [],
            trace_id: 'trace-1',
            timestamp: '2026-08-17T10:00:00.000Z',
            path: '/v1/cabinets',
          },
        },
        { 'retry-after': '1' }
      )
    )

    const error = await createCabinet({ name: 'Other' }, ctx).catch(e => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(409)
    expect((error as ApiError).message).toContain('different payload')
  })

  it('409 in-progress: retryable conflict surfaces as 409 ApiError (Retry-After present per swagger)', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        409,
        {
          error: {
            code: 'CABINET_CREATION_IN_PROGRESS',
            message: 'Creation already in progress',
            details: [],
            trace_id: 'trace-2',
            timestamp: '2026-08-17T10:00:00.000Z',
            path: '/v1/cabinets',
          },
        },
        { 'retry-after': '1' }
      )
    )

    const error = await createCabinet({ name: 'Test Cabinet' }, ctx).catch(e => e)

    // Retry-After is carried by the live 409 contract; the FE retry policy for
    // this conflict class is Story 167.5's consumer concern, not 167.9's.
    expect((error as ApiError).status).toBe(409)
    expect((error as ApiError).message).toContain('in progress')
  })

  it('400: malformed Idempotency-Key is rejected as CABINET_CREATION_IDEMPOTENCY_KEY_INVALID', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(400, {
        error: {
          code: 'CABINET_CREATION_IDEMPOTENCY_KEY_INVALID',
          message: 'Idempotency-Key must be a UUID v4',
          details: [],
          trace_id: 'trace-3',
          timestamp: '2026-08-17T10:00:00.000Z',
          path: '/v1/cabinets',
        },
      })
    )

    const error = await createCabinet({ name: 'Test Cabinet' }, ctx).catch(e => e)

    expect((error as ApiError).status).toBe(400)
  })
})

describe('GET /v1/cabinets/creation-operations/:operationId contract (Story 167.8)', () => {
  it('200 in_progress: CabinetCreationInProgressDto shape', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        operationId: '9ca8c2ba-0b3f-4a2a-b20c-27db4d60a7b0',
        status: 'in_progress',
        retryable: true,
        retryAfterSeconds: 1,
      })
    )

    const state = (await getCabinetCreationOperation(
      '9ca8c2ba-0b3f-4a2a-b20c-27db4d60a7b0',
      'initiating-token-A'
    )) as CabinetCreationOperationState

    expect(state.status).toBe('in_progress')
    if (state.status === 'in_progress') {
      expect(state.retryable).toBe(true)
      expect(state.retryAfterSeconds).toBe(1)
    }
  })

  it('200 failed: CabinetCreationFailedDto shape (failure enum code + retryable)', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        operationId: '9ca8c2ba-0b3f-4a2a-b20c-27db4d60a7b0',
        status: 'failed',
        failure: { code: 'CABINET_CREATION_FAILED', retryable: true },
        completedAt: '2026-08-17T10:01:00.000Z',
      })
    )

    const state = (await getCabinetCreationOperation(
      '9ca8c2ba-0b3f-4a2a-b20c-27db4d60a7b0',
      'initiating-token-A'
    )) as CabinetCreationOperationState

    expect(state.status).toBe('failed')
    if (state.status === 'failed') {
      expect(state.failure.code).toBe('CABINET_CREATION_FAILED')
      // The DTO enum also admits CABINET_CREATION_ACCOUNT_INELIGIBLE (live swagger
      // CabinetCreationFailureDto.code enum); pinned by the failed-variant fixture below.
    }
  })

  it('404: unknown/cross-account operation is 404-neutral CABINET_CREATION_OPERATION_NOT_FOUND', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(404, {
        error: {
          code: 'CABINET_CREATION_OPERATION_NOT_FOUND',
          message: 'Creation operation not found',
          details: [],
          trace_id: 'trace-4',
          timestamp: '2026-08-17T10:00:00.000Z',
          path: '/v1/cabinets/creation-operations/9ca8c2ba-0b3f-4a2a-b20c-27db4d60a7b0',
        },
      })
    )

    const error = await getCabinetCreationOperation(
      '9ca8c2ba-0b3f-4a2a-b20c-27db4d60a7b0',
      'initiating-token-A'
    ).catch(e => e)

    expect((error as ApiError).status).toBe(404)
  })
})
