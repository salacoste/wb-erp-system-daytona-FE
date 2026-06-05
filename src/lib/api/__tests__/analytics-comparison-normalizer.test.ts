/**
 * Boundary Normalizer Tests — Analytics Comparison
 *
 * Covers normalizeComparisonResponse for null input, missing fields,
 * empty arrays, and full shapes.
 */

import { describe, it, expect } from 'vitest'
import { normalizeComparisonResponse } from '../analytics-comparison-normalizer'

// ---------------------------------------------------------------------------
// normalizeComparisonResponse
// ---------------------------------------------------------------------------

describe('normalizeComparisonResponse', () => {
  const fullRaw = {
    period1: {
      week: '2026-W05',
      revenue: 500000,
      profit: 150000,
      margin_pct: 30.0,
      orders: 1000,
      cogs: 200000,
      logistics: 50000,
      storage: 20000,
      advertising: 80000,
    },
    period2: {
      week: '2026-W04',
      revenue: 450000,
      profit: 120000,
      margin_pct: 26.7,
      orders: 900,
      cogs: 190000,
      logistics: 48000,
      storage: 18000,
      advertising: 74000,
    },
    delta: {
      revenue: { absolute: 50000, percent: 11.1 },
      profit: { absolute: 30000, percent: 25.0 },
      margin_pct: { absolute: 3.3, percent: 12.4 },
      orders: { absolute: 100, percent: 11.1 },
      cogs: { absolute: 10000, percent: 5.3 },
      logistics: { absolute: 2000, percent: 4.2 },
      storage: { absolute: 2000, percent: 11.1 },
      advertising: { absolute: 6000, percent: 8.1 },
    },
    breakdown: [
      {
        id: 'brand-1',
        name: 'Brand X',
        period1_value: 200000,
        period2_value: 180000,
        delta_absolute: 20000,
        delta_percent: 11.1,
      },
    ],
  }

  it('maps a full comparison response to canonical shape', () => {
    const result = normalizeComparisonResponse(fullRaw)
    expect(result.period1.week).toBe('2026-W05')
    expect(result.period1.revenue).toBe(500000)
    expect(result.period1.margin_pct).toBe(30.0)
    expect(result.period1.orders).toBe(1000)
    expect(result.period2.week).toBe('2026-W04')
    expect(result.period2.revenue).toBe(450000)
    expect(result.delta.revenue.absolute).toBe(50000)
    expect(result.delta.revenue.percent).toBe(11.1)
    expect(result.delta.profit.absolute).toBe(30000)
    expect(result.breakdown).toHaveLength(1)
    expect(result.breakdown![0].id).toBe('brand-1')
    expect(result.breakdown![0].name).toBe('Brand X')
  })

  it('returns safe defaults for null input', () => {
    const result = normalizeComparisonResponse(null)
    expect(result.period1).toEqual({
      week: '',
      revenue: 0,
      profit: 0,
      margin_pct: 0,
      orders: 0,
      cogs: 0,
      logistics: 0,
      storage: 0,
      advertising: 0,
    })
    expect(result.period2).toEqual({
      week: '',
      revenue: 0,
      profit: 0,
      margin_pct: 0,
      orders: 0,
      cogs: 0,
      logistics: 0,
      storage: 0,
      advertising: 0,
    })
    expect(result.delta.revenue.absolute).toBe(0)
    expect(result.delta.revenue.percent).toBe(0)
    expect(result.breakdown).toBeUndefined()
  })

  it('returns safe defaults for undefined input', () => {
    const result = normalizeComparisonResponse(undefined)
    expect(result.period1.week).toBe('')
    expect(result.period1.orders).toBe(0)
  })

  it('handles null money/ratio fields in period metrics (AP#8)', () => {
    const raw = {
      period1: { revenue: null, profit: null, margin_pct: null, cogs: null },
      period2: { week: '2026-W04' },
      delta: {},
    }
    const result = normalizeComparisonResponse(raw)
    expect(result.period1.revenue).toBe(0)
    expect(result.period1.profit).toBe(0)
    expect(result.period1.margin_pct).toBe(0)
    expect(result.period1.cogs).toBe(0)
  })

  it('handles missing breakdown as undefined', () => {
    const raw = { period1: {}, period2: {}, delta: {} }
    const result = normalizeComparisonResponse(raw)
    expect(result.breakdown).toBeUndefined()
  })

  it('handles empty breakdown array', () => {
    const raw = { period1: {}, period2: {}, delta: {}, breakdown: [] }
    const result = normalizeComparisonResponse(raw)
    expect(result.breakdown).toEqual([])
  })

  it('handles null delta fields (AP#8)', () => {
    const raw = {
      period1: {},
      period2: {},
      delta: { revenue: { absolute: null, percent: null } },
    }
    const result = normalizeComparisonResponse(raw)
    expect(result.delta.revenue.absolute).toBe(0)
    expect(result.delta.revenue.percent).toBe(0)
  })

  it('handles missing delta sub-fields', () => {
    const raw = { period1: {}, period2: {}, delta: {} }
    const result = normalizeComparisonResponse(raw)
    expect(result.delta.revenue.absolute).toBe(0)
    expect(result.delta.profit.percent).toBe(0)
  })

  it('handles null breakdown item fields (AP#8)', () => {
    const raw = {
      period1: {},
      period2: {},
      delta: {},
      breakdown: [
        { period1_value: null, period2_value: null, delta_absolute: null, delta_percent: null },
      ],
    }
    const result = normalizeComparisonResponse(raw)
    expect(result.breakdown![0].period1_value).toBe(0)
    expect(result.breakdown![0].delta_percent).toBe(0)
  })
})
