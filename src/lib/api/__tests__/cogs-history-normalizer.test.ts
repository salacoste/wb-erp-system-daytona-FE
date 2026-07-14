/**
 * cogs-history normalizer — Validation F-37.
 * Pins: string `unit_cost_rub` ("500") is coerced to a number in both data rows and
 * meta.current_cogs; numbers pass through; other fields + null current_cogs untouched.
 */

import { describe, it, expect } from 'vitest'
import { normalizeCogsHistoryResponse } from '../cogs-history-normalizer'
import type { CogsHistoryResponse } from '@/types/cogs'

function build(overrides: Partial<CogsHistoryResponse> = {}): CogsHistoryResponse {
  return {
    data: [
      { cogs_id: 'c1', nm_id: '1', unit_cost_rub: '500', valid_from: '2026-05-01', valid_to: null },
    ],
    meta: {
      nm_id: '1',
      product_name: 'P',
      current_cogs: { unit_cost_rub: '500', valid_from: '2026-05-01' },
      total_versions: 2,
    },
    pagination: { total: 2, cursor: null, has_more: false },
    ...overrides,
  } as unknown as CogsHistoryResponse
}

describe('normalizeCogsHistoryResponse — F-37 unit_cost_rub coercion', () => {
  it('coerces string unit_cost_rub to number in data rows', () => {
    const res = normalizeCogsHistoryResponse(build())
    expect(res.data[0].unit_cost_rub).toBe(500)
    expect(typeof res.data[0].unit_cost_rub).toBe('number')
  })

  it('coerces string unit_cost_rub to number in meta.current_cogs', () => {
    const res = normalizeCogsHistoryResponse(build())
    expect(res.meta.current_cogs?.unit_cost_rub).toBe(500)
    expect(typeof res.meta.current_cogs?.unit_cost_rub).toBe('number')
  })

  it('passes a numeric unit_cost_rub through unchanged', () => {
    const res = normalizeCogsHistoryResponse(
      build({
        data: [
          { cogs_id: 'c1', nm_id: '1', unit_cost_rub: 1250.5, valid_from: 'x', valid_to: null },
        ] as unknown as CogsHistoryResponse['data'],
      })
    )
    expect(res.data[0].unit_cost_rub).toBe(1250.5)
  })

  it('leaves null current_cogs and other fields untouched', () => {
    const res = normalizeCogsHistoryResponse(
      build({
        meta: { nm_id: '1', product_name: 'P', current_cogs: null, total_versions: 0 },
      } as unknown as Partial<CogsHistoryResponse>)
    )
    expect(res.meta.current_cogs).toBeNull()
    expect(res.meta.product_name).toBe('P')
    expect(res.pagination.total).toBe(2)
  })

  it('maps empty-string / null / non-numeric unit_cost_rub to NaN (NOT 0 — anti-pattern #8)', () => {
    const make = (cost: unknown) =>
      normalizeCogsHistoryResponse(
        build({
          data: [
            { cogs_id: 'c', nm_id: '1', unit_cost_rub: cost, valid_from: 'x', valid_to: null },
          ] as unknown as CogsHistoryResponse['data'],
        })
      ).data[0].unit_cost_rub

    expect(make('')).toBeNaN()
    expect(make(null)).toBeNaN()
    expect(make(undefined)).toBeNaN()
    expect(make('abc')).toBeNaN()
    // critically NOT 0 — a 0 here would fabricate a real 0 ₽ cost
    expect(make('')).not.toBe(0)
  })

  it('returns [] data for a malformed (missing data array) response', () => {
    const res = normalizeCogsHistoryResponse({
      meta: {},
      pagination: {},
    } as unknown as CogsHistoryResponse)
    expect(res.data).toEqual([])
  })

  it('preserves source:"moysklad" through normalization (BD-13)', () => {
    // МойСклад sync emits source:"moysklad"; the normalizer spreads {...item} and must
    // NOT whitelist `source`, otherwise SourceCell falls back to `manual` (✏️ «Ручной ввод»).
    const res = normalizeCogsHistoryResponse(
      build({
        data: [
          {
            cogs_id: 'c1',
            nm_id: '1',
            unit_cost_rub: 500,
            valid_from: '2026-05-01',
            valid_to: null,
            source: 'moysklad',
          },
        ] as unknown as CogsHistoryResponse['data'],
      })
    )
    expect(res.data[0].source).toBe('moysklad')
  })
})
