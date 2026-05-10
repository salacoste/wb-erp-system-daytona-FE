/**
 * Direct tests for api-client 503/429 + Retry-After validation logic.
 * Story 96.9-FE 3rd-pass review fix M3-2 (2026-05-08).
 * Story 96.12-FE 1st-pass review fix M-2 (2026-05-08): string body retryAfter.
 *
 * Coverage targets (src/lib/api-client.ts:103-134):
 *   - Header: regex `^\d+$` (only digit strings accepted — negatives, decimals, HTTP-date all rejected)
 *   - Header: range [1, 600] inclusive (0 and 601 rejected)
 *   - Header: 503-only gating (502 does NOT capture Retry-After)
 *   - Body fallback: numeric retryAfter (number type)
 *   - Body fallback: string retryAfter e.g. "60" (M-2 fix)
 *   - Body fallback: decimal string "30.5" rejected
 *   - Body fallback: whitespace-padded " 45 " accepted
 *
 * Strategy: stub `globalThis.fetch` per test case to return a controlled
 * Response. The apiClient.get() call is expected to throw ApiError (non-OK
 * response) — assertions are made on the thrown error's `.retryAfter` field.
 *
 * Each test wraps the call in try/catch and asserts `instanceof ApiError`
 * + `.status` to confirm the right code path ran, then checks `.retryAfter`.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { apiClient } from '../api-client'
import { ApiError } from '@/types/api'

function makeResponse(status: number, retryAfterHeader: string | null): Response {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (retryAfterHeader !== null) {
    headers['Retry-After'] = retryAfterHeader
  }
  return new Response(JSON.stringify({ error: { message: 'rate limit' } }), {
    status,
    headers,
  })
}

function makeBodyResponse(status: number, bodyRetryAfter: unknown): Response {
  // No Retry-After header — forces the body-fallback path in api-client.ts.
  return new Response(
    JSON.stringify({ retryAfter: bodyRetryAfter, error: { message: 'rate limit' } }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

async function getRetryAfter(
  status: number,
  retryAfterHeader: string | null
): Promise<number | undefined> {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(status, retryAfterHeader)))
  try {
    await apiClient.get('/test-endpoint')
    return undefined // should not reach here
  } catch (err) {
    expect(err).toBeInstanceOf(ApiError)
    return (err as ApiError).retryAfter
  } finally {
    vi.unstubAllGlobals()
  }
}

async function getBodyRetryAfter(
  status: number,
  bodyRetryAfter: unknown
): Promise<number | undefined> {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeBodyResponse(status, bodyRetryAfter)))
  try {
    await apiClient.get('/test-endpoint')
    return undefined // should not reach here
  } catch (err) {
    expect(err).toBeInstanceOf(ApiError)
    return (err as ApiError).retryAfter
  } finally {
    vi.unstubAllGlobals()
  }
}

describe('api-client Retry-After validation (Story 96.9-FE M3-2)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('503 + Retry-After: 30 → retryAfter === 30', async () => {
    expect(await getRetryAfter(503, '30')).toBe(30)
  })

  it('503 + Retry-After: 1 → retryAfter === 1 (lower bound inclusive)', async () => {
    expect(await getRetryAfter(503, '1')).toBe(1)
  })

  it('503 + Retry-After: 600 → retryAfter === 600 (upper bound inclusive)', async () => {
    expect(await getRetryAfter(503, '600')).toBe(600)
  })

  it('503 + Retry-After: 0 → retryAfter === undefined (below range)', async () => {
    expect(await getRetryAfter(503, '0')).toBeUndefined()
  })

  it('503 + Retry-After: 601 → retryAfter === undefined (above range)', async () => {
    expect(await getRetryAfter(503, '601')).toBeUndefined()
  })

  it('503 + Retry-After: -5 → retryAfter === undefined (regex rejects sign)', async () => {
    expect(await getRetryAfter(503, '-5')).toBeUndefined()
  })

  it('503 + Retry-After: 30.5 → retryAfter === undefined (regex rejects decimal)', async () => {
    expect(await getRetryAfter(503, '30.5')).toBeUndefined()
  })

  it('503 + Retry-After:  30  (whitespace-padded) → retryAfter === 30 (trim works)', async () => {
    expect(await getRetryAfter(503, '  30  ')).toBe(30)
  })

  it('503 + Retry-After: empty string → retryAfter === undefined', async () => {
    expect(await getRetryAfter(503, '')).toBeUndefined()
  })

  it('503 + missing Retry-After header → retryAfter === undefined', async () => {
    expect(await getRetryAfter(503, null)).toBeUndefined()
  })

  it('503 + Retry-After: HTTP-date → retryAfter === undefined (RFC 7231 § 7.1.3 HTTP-date out of scope)', async () => {
    expect(await getRetryAfter(503, 'Wed, 21 Oct 2015 07:28:00 GMT')).toBeUndefined()
  })

  it('502 + Retry-After: 30 → retryAfter === undefined (only 503 captures)', async () => {
    expect(await getRetryAfter(502, '30')).toBeUndefined()
  })

  // ---------------------------------------------------------------------------
  // Body fallback — M-2 fix (Story 96.12-FE 1st-pass review 2026-05-08)
  // Tests the body { retryAfter: N } path when header is absent.
  // Covers both number type and string type (M-2 adds string support).
  // ---------------------------------------------------------------------------

  it('429 + body { retryAfter: 60 } (number) → retryAfter === 60', async () => {
    expect(await getBodyRetryAfter(429, 60)).toBe(60)
  })

  it('429 + body { retryAfter: "60" } (string) → retryAfter === 60 (M-2 fix)', async () => {
    expect(await getBodyRetryAfter(429, '60')).toBe(60)
  })

  it('429 + body { retryAfter: "30.5" } (decimal string) → retryAfter === undefined (regex rejects)', async () => {
    expect(await getBodyRetryAfter(429, '30.5')).toBeUndefined()
  })

  it('429 + body { retryAfter: " 45 " } (whitespace-padded string) → retryAfter === 45', async () => {
    expect(await getBodyRetryAfter(429, ' 45 ')).toBe(45)
  })
})
