/**
 * Unit tests for normalizeCabinetSummaryResponse
 * Request #56: map summary.totals.wb_services_breakdown {promotion,jam,other}
 * → flat wb_*_cost fields the P&L waterfall (OtherAdjustmentsRows) reads.
 */

import { describe, it, expect } from 'vitest'
import { normalizeCabinetSummaryResponse } from '../cabinet-summary-normalizer'
import type { CabinetSummaryResponse, CabinetSummaryTotals } from '@/types/analytics'

// Minimal totals stub — only fields under test plus required props.
function makeTotals(overrides: Partial<CabinetSummaryTotals> = {}): CabinetSummaryTotals {
  return {
    sales_gross: null,
    returns_gross: null,
    sale_gross: null,
    total_commission_rub: null,
    logistics_cost: null,
    storage_cost: null,
    paid_acceptance_cost: null,
    penalties: null,
    payout_total: null,
    revenue_net: 0,
    cogs_total: null,
    profit: null,
    margin_pct: null,
    qty: 0,
    profit_per_unit: null,
    roi: null,
    ...overrides,
  }
}

function makeResponse(totals: CabinetSummaryTotals): CabinetSummaryResponse {
  return {
    summary: {
      totals,
      products: { total: 0, with_cogs: 0, without_cogs: 0, coverage_pct: 0 },
      trends: {
        revenue_trend: 'stable',
        profit_trend: 'stable',
        margin_trend: 'stable',
        week_over_week_growth: 0,
      },
    },
    top_products: [],
    top_brands: [],
    meta: {
      cabinet_id: 'c1',
      period: { start: '2025-W44', end: '2025-W47', weeks_count: 4 },
      generated_at: '2025-12-05T10:00:00Z',
    },
  }
}

describe('normalizeCabinetSummaryResponse', () => {
  it('maps breakdown object → flat wb_*_cost fields (live shape)', () => {
    const input = makeResponse(
      makeTotals({
        wb_services_breakdown: { promotion: 199149, jam: 22990, other: 456 },
      })
    )

    const out = normalizeCabinetSummaryResponse(input)

    expect(out.summary.totals.wb_promotion_cost).toBe(199149)
    expect(out.summary.totals.wb_jam_cost).toBe(22990)
    expect(out.summary.totals.wb_other_services_cost).toBe(456)
  })

  it('sets flat fields to null (not 0 — AP#8) when no breakdown and no flat values', () => {
    const input = makeResponse(makeTotals())

    const out = normalizeCabinetSummaryResponse(input)

    expect(out.summary.totals.wb_promotion_cost).toBeNull()
    expect(out.summary.totals.wb_jam_cost).toBeNull()
    expect(out.summary.totals.wb_other_services_cost).toBeNull()
  })

  it('preserves legacy flat fields if backend ever sends them (not overwritten by breakdown)', () => {
    const input = makeResponse(
      makeTotals({
        wb_promotion_cost: 111,
        wb_jam_cost: 222,
        wb_other_services_cost: 333,
        wb_services_breakdown: { promotion: 999, jam: 888, other: 777 },
      })
    )

    const out = normalizeCabinetSummaryResponse(input)

    expect(out.summary.totals.wb_promotion_cost).toBe(111)
    expect(out.summary.totals.wb_jam_cost).toBe(222)
    expect(out.summary.totals.wb_other_services_cost).toBe(333)
  })

  it('maps each sub-field independently when the breakdown is partial', () => {
    const input = makeResponse(makeTotals({ wb_services_breakdown: { promotion: 5000 } }))

    const out = normalizeCabinetSummaryResponse(input)

    expect(out.summary.totals.wb_promotion_cost).toBe(5000)
    // jam/other absent in the breakdown → null (AP#8), not 0
    expect(out.summary.totals.wb_jam_cost).toBeNull()
    expect(out.summary.totals.wb_other_services_cost).toBeNull()
  })

  it('preserves a real 0 sub-value (the >0 display-guard hides the row, but 0 is not coerced to null)', () => {
    const input = makeResponse(
      makeTotals({ wb_services_breakdown: { promotion: 5000, jam: 0, other: 0 } })
    )

    const out = normalizeCabinetSummaryResponse(input)

    // 0 ?? null === 0 (nullish coalescing does not replace 0) → row hidden by the component's > 0 guard
    expect(out.summary.totals.wb_jam_cost).toBe(0)
    expect(out.summary.totals.wb_other_services_cost).toBe(0)
  })

  it('returns raw unchanged when summary.totals is absent (no throw)', () => {
    const raw = { top_products: [], top_brands: [] } as unknown as CabinetSummaryResponse

    expect(() => normalizeCabinetSummaryResponse(raw)).not.toThrow()
    expect(normalizeCabinetSummaryResponse(raw)).toBe(raw)
  })
})
