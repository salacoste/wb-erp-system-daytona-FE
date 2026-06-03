/**
 * Unit tests for buildChartSegments — price-structure reconciliation.
 *
 * Core invariant: chart segments must sum to 100% of the recommended price.
 * The fixed-cost base (COGS + logistics + storage) is derived as the residual
 * `price - (commission + acquiring + advertising + vat + margin)` so the
 * "Структура цены" chart reconciles fully instead of showing only the
 * percentage-rate portion (~46% of price on the old code).
 */

import { describe, it, expect } from 'vitest'
import { buildChartSegments, type ChartInputParams } from '../cost-breakdown-helpers'

const params: ChartInputParams = {
  commissionPct: 15,
  acquiringPct: 2,
  drrPct: 5,
  vatPct: 0,
}

describe('buildChartSegments — fixed-cost reconciliation', () => {
  // Realistic breakdown: fixed residual = 1810.34 - (271.55+36.21+90.52+0+362.07) = 1049.99
  const breakdown = {
    commission_wb: 271.55,
    acquiring: 36.21,
    advertising: 90.52,
    vat: 0,
    margin: 362.07,
  }
  const recommendedPrice = 1810.34

  it('includes a fixed-cost segment ≈ the residual', () => {
    const segments = buildChartSegments(breakdown, recommendedPrice, params)
    const fixed = segments.find(s => s.key === 'fixed')

    expect(fixed).toBeDefined()
    expect(fixed?.rub).toBeCloseTo(1050, 0)
    expect(fixed?.rub).toBeGreaterThan(1049.5)
    expect(fixed?.rub).toBeLessThan(1050.5)
  })

  it('reconciles all segments to 100% of the recommended price', () => {
    const segments = buildChartSegments(breakdown, recommendedPrice, params)
    const sumRub = segments.reduce((acc, s) => acc + s.rub, 0)

    // The fix enables this: previously the sum was only ~46% of price.
    expect(sumRub).toBeCloseTo(recommendedPrice, 1)

    const sumPct = segments.reduce((acc, s) => acc + s.pct, 0)
    expect(sumPct).toBeCloseTo(100, 1)
  })

  it('keeps margin last and marks the fixed segment as non-margin', () => {
    const segments = buildChartSegments(breakdown, recommendedPrice, params)

    expect(segments[segments.length - 1]?.key).toBe('margin')
    expect(segments[segments.length - 1]?.isMargin).toBe(true)

    const fixed = segments.find(s => s.key === 'fixed')
    expect(fixed?.isMargin).toBe(false)
  })

  it('sorts the fixed segment by size among the cost segments (largest first)', () => {
    const segments = buildChartSegments(breakdown, recommendedPrice, params)
    const costSegments = segments.filter(s => !s.isMargin)

    // Costs sorted largest -> smallest; fixed (1050) is the largest cost here.
    expect(costSegments[0]?.key).toBe('fixed')
    for (let i = 1; i < costSegments.length; i++) {
      expect(costSegments[i - 1]!.pct).toBeGreaterThanOrEqual(costSegments[i]!.pct)
    }
  })

  it('omits the fixed segment in the degenerate case where the residual is ≤ 0', () => {
    // price exactly equals pct-segments + margin => fixedRub == 0 => filtered out.
    const degeneratePrice =
      breakdown.commission_wb +
      breakdown.acquiring +
      breakdown.advertising +
      breakdown.vat +
      breakdown.margin

    const segments = buildChartSegments(breakdown, degeneratePrice, params)
    const fixed = segments.find(s => s.key === 'fixed')

    expect(fixed).toBeUndefined()
    // No negative or zero base segment leaks through.
    expect(segments.every(s => s.rub > 0)).toBe(true)
  })
})
