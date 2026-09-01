/**
 * Story 174.4 — G1 contract probe: bulk COGS integer wire (BE-A-1).
 *
 * Pins the FULL traversal real hook (useBulkCogsAssignment) →
 * toBulkCogsWireRequest (src/lib/api/bulk-cogs-wire.ts) → apiClient →
 * fetch → MSW: `nm_id` MUST cross the wire as a JSON NUMBER on
 * POST /v1/products/cogs/bulk?format=v2.
 *
 * FE domain keeps nm_id as a string (opaque-ID rule, anti-pattern #10) and the
 * BE bulk endpoint rejects string nm_id with 400 (memory: BE-A-1 integer
 * contract, commit dc81c957). The wire converter is the boundary that converts.
 *
 * Also pins the negative branch: an item whose nm_id is not a digit-string
 * throws BEFORE any request leaves the client (zero requests captured).
 *
 * No `as`/`any`; real MSW interception (unhandled requests error out).
 */

import { describe, it, expect, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, act } from '@testing-library/react'
import { server } from '@/mocks/server'
import { useBulkCogsAssignment } from '@/hooks/useBulkCogsAssignment'
import { createQueryWrapper, setupMockAuth, clearMockAuth } from '@/test/test-utils'
import type { BulkCogsItem } from '@/types/api'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const BULK_URL = `${API}/v1/products/cogs/bulk`

/** Type-guard: a JSON object value (no `as` casts). */
function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Guard-narrowed `items[]` element list from the captured wire body. */
function readWireItems(body: Record<string, unknown>): Array<Record<string, unknown>> {
  const items: unknown = body.items
  if (!Array.isArray(items)) throw new Error('Expected items[] on the bulk COGS wire body')
  return items.map(item => {
    if (!isJsonObject(item)) {
      throw new Error('Expected object items[] entries on the bulk COGS wire body')
    }
    return item
  })
}

const VALID_ITEMS: BulkCogsItem[] = [
  { nm_id: '12345678', unit_cost_rub: 150.5, valid_from: '2026-09-01' },
  { nm_id: '87654321', unit_cost_rub: 99, valid_from: '2026-09-01', sa_name: 'Поставщик' },
]

afterEach(() => {
  clearMockAuth()
})

describe('G1 — bulk COGS integer wire contract (BE-A-1, MSW)', () => {
  it('sends nm_id as typeof number (safe integer) — FE string never serializes', async () => {
    const urls: string[] = []
    const rawBodies: string[] = []
    const authHeaders: string[] = []
    const cabinetHeaders: string[] = []

    server.use(
      http.post(BULK_URL, async ({ request }) => {
        urls.push(request.url)
        authHeaders.push(request.headers.get('Authorization') ?? '')
        cabinetHeaders.push(request.headers.get('X-Cabinet-Id') ?? '')
        rawBodies.push(await request.clone().text())
        return HttpResponse.json({ succeeded: 2, failed: 0, results: [], message: 'ok' })
      })
    )

    setupMockAuth({ token: 'manager-jwt', cabinetId: 'cab-4021' })
    const { result } = renderHook(() => useBulkCogsAssignment(), {
      wrapper: createQueryWrapper(),
    })

    let resolvedSummary: unknown
    await act(async () => {
      resolvedSummary = await result.current.mutateAsync({ items: VALID_ITEMS })
    })

    // Exactly one POST traversed the client to MSW.
    expect(urls).toHaveLength(1)
    // v2 envelope is requested via the query string (Request #186).
    expect(urls[0]).toContain('format=v2')

    // Injected auth context rides along (auto header injection contract).
    expect(authHeaders[0]).toBe('Bearer manager-jwt')
    expect(cabinetHeaders[0]).toBe('cab-4021')

    // Wire payload shape: exactly { items } (no assignments key when unset).
    const parsedBody: unknown = JSON.parse(rawBodies[0])
    if (!isJsonObject(parsedBody)) {
      throw new Error('Expected a JSON object bulk COGS wire body')
    }
    const body = parsedBody
    expect(Object.keys(body).sort()).toEqual(['items'])

    // THE contract: every nm_id is a JSON number, integer, safe.
    const wireItems = readWireItems(body)
    expect(wireItems).toHaveLength(2)
    for (const item of wireItems) {
      const nmId: unknown = item.nm_id
      expect(typeof nmId).toBe('number')
      expect(Number.isInteger(nmId)).toBe(true)
      expect(Number.isSafeInteger(nmId)).toBe(true)
    }
    // Converted values, order preserved; the other fields pass through untouched.
    expect(wireItems[0].nm_id).toBe(12345678)
    expect(wireItems[1].nm_id).toBe(87654321)
    expect(wireItems[0].unit_cost_rub).toBe(150.5)
    expect(wireItems[0].valid_from).toBe('2026-09-01')
    expect(wireItems[1].sa_name).toBe('Поставщик')

    // Wire-level negative proof: a STRING nm_id never serializes into the body.
    expect(rawBodies[0]).not.toContain('"nm_id":"')

    // The hook resolved the normalized v2 summary through the boundary normalizer.
    // (Assert on the mutateAsync resolution — render-state reads lag under fake timers.)
    expect(resolvedSummary).toMatchObject({ succeeded: 2, failed: 0 })
  })

  it('rejects a non-digit nm_id BEFORE any request leaves the client (zero POSTs)', async () => {
    const urls: string[] = []
    server.use(
      http.post(BULK_URL, async ({ request }) => {
        urls.push(request.url)
        return HttpResponse.json({ succeeded: 0, failed: 0, results: [], message: '' })
      })
    )

    setupMockAuth({ token: 'manager-jwt', cabinetId: 'cab-4021' })
    const { result } = renderHook(() => useBulkCogsAssignment(), {
      wrapper: createQueryWrapper(),
    })

    // '12a45' is not a digit-string — parseBulkCogsNmId refuses it and
    // toBulkCogsWireRequest throws before apiClient is ever called.
    await expect(
      act(async () => {
        await result.current.mutateAsync({
          items: [{ nm_id: '12a45', unit_cost_rub: 10, valid_from: '2026-09-01' }],
        })
      })
    ).rejects.toThrow(/Invalid bulk COGS nm_id/)

    expect(urls).toHaveLength(0)
    // (.rejects.toThrow above already proves the error propagates to the caller;
    //  render-state isError reads lag under fake timers and are not the contract.)
  })
})
