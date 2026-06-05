/**
 * Daily Analytics Normalizer Tests
 * Covers: null input, missing fields, empty arrays for all 4 normalizers.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeOrdersTrendsResponse,
  normalizeFinanceDailyResponse,
  normalizeAdvertisingDailyResponse,
  normalizeOrdersCogsResponse,
} from '../daily-analytics-normalizer'

// ---------------------------------------------------------------------------
// normalizeOrdersTrendsResponse
// ---------------------------------------------------------------------------

describe('normalizeOrdersTrendsResponse', () => {
  it('happy path: normalizes trends envelope to OrdersDailyData[]', () => {
    const raw = {
      trends: [
        { date: '2025-01-01', revenue: 1000, ordersCount: 5 },
        { date: '2025-01-02', revenue: 2000, ordersCount: 10 },
      ],
    }
    const result = normalizeOrdersTrendsResponse(raw)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ date: '2025-01-01', total_amount: 1000, total_orders: 5 })
    expect(result[1]).toEqual({ date: '2025-01-02', total_amount: 2000, total_orders: 10 })
  })

  it('null input returns empty array', () => {
    expect(normalizeOrdersTrendsResponse(null)).toEqual([])
  })

  it('bare array input is treated as trends', () => {
    const raw = [{ date: '2025-01-01', revenue: 500, ordersCount: 3 }]
    const result = normalizeOrdersTrendsResponse(raw)
    expect(result).toHaveLength(1)
    expect(result[0].total_amount).toBe(500)
  })

  it('missing fields default safely (date="", revenue=0, orders=0)', () => {
    const raw = { trends: [{}] }
    const result = normalizeOrdersTrendsResponse(raw)
    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('')
    expect(result[0].total_amount).toBe(0)
    expect(result[0].total_orders).toBe(0)
  })

  it('null revenue falls back to 0 (count-like for total_amount)', () => {
    const raw = { trends: [{ date: '2025-01-01', revenue: null, ordersCount: 5 }] }
    const result = normalizeOrdersTrendsResponse(raw)
    expect(result[0].total_amount).toBe(0)
  })

  it('empty trends array returns empty', () => {
    expect(normalizeOrdersTrendsResponse({ trends: [] })).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// normalizeFinanceDailyResponse
// ---------------------------------------------------------------------------

describe('normalizeFinanceDailyResponse', () => {
  it('happy path: normalizes bare array with camelCase fields', () => {
    const raw = [
      {
        date: '2025-01-01',
        revenueGross: 1000,
        revenueNet: 800,
        cogsTotal: 500,
        logistics: 50,
        storage: 20,
        penalties: 0,
        paidAcceptance: 10,
        commission: 100,
        returns: 30,
        returnsCount: 2,
        salesCount: 10,
        advertisingSpend: 200,
        netProfit: 100,
      },
    ]
    const result = normalizeFinanceDailyResponse(raw)
    expect(result).toHaveLength(1)
    const item = result[0]
    expect(item.date).toBe('2025-01-01')
    expect(item.wb_sales_gross).toBe(1000)
    expect(item.cogs_total).toBe(500)
    expect(item.net_profit).toBe(100)
    expect(item.sales_count).toBe(10)
    expect(item.returns_count).toBe(2)
  })

  it('null input returns empty array', () => {
    expect(normalizeFinanceDailyResponse(null)).toEqual([])
  })

  it('non-array returns empty array', () => {
    expect(normalizeFinanceDailyResponse({ data: [] })).toEqual([])
  })

  it('missing fields default safely', () => {
    const raw = [{}]
    const result = normalizeFinanceDailyResponse(raw)
    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('')
    expect(result[0].wb_sales_gross).toBe(0)
    expect(result[0].cogs_total).toBeNull()
    expect(result[0].net_profit).toBeNull()
    expect(result[0].sales_count).toBe(0)
  })

  it('null cogs_total and net_profit are preserved as null', () => {
    const raw = [{ date: '2025-01-01', cogsTotal: null, netProfit: null }]
    const result = normalizeFinanceDailyResponse(raw)
    expect(result[0].cogs_total).toBeNull()
    expect(result[0].net_profit).toBeNull()
  })

  it('NaN values are coerced to null for money fields', () => {
    const raw = [{ date: '2025-01-01', cogsTotal: NaN, netProfit: NaN }]
    const result = normalizeFinanceDailyResponse(raw)
    expect(result[0].cogs_total).toBeNull()
    expect(result[0].net_profit).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// normalizeAdvertisingDailyResponse
// ---------------------------------------------------------------------------

describe('normalizeAdvertisingDailyResponse', () => {
  it('happy path: normalizes bare array', () => {
    const raw = [
      {
        date: '2025-01-01',
        spend: 500,
        views: 1000,
        clicks: 50,
        ctr: 5.0,
        cpc: 10,
        orders: 5,
        revenue: 2000,
        roas: 4.0,
      },
    ]
    const result = normalizeAdvertisingDailyResponse(raw)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      date: '2025-01-01',
      total_spend: 500,
      views: 1000,
      clicks: 50,
      ctr: 5.0,
      cpc: 10,
      orders: 5,
      revenue: 2000,
      roas: 4.0,
    })
  })

  it('null input returns empty array', () => {
    expect(normalizeAdvertisingDailyResponse(null)).toEqual([])
  })

  it('null money/ratio fields are preserved as null', () => {
    const raw = [
      { date: '2025-01-01', spend: null, ctr: null, cpc: null, revenue: null, roas: null },
    ]
    const result = normalizeAdvertisingDailyResponse(raw)
    expect(result[0].total_spend).toBe(0)
    expect(result[0].ctr).toBeNull()
    expect(result[0].cpc).toBeNull()
    expect(result[0].revenue).toBeNull()
    expect(result[0].roas).toBeNull()
  })

  it('missing fields default safely', () => {
    const raw = [{}]
    const result = normalizeAdvertisingDailyResponse(raw)
    expect(result[0].date).toBe('')
    expect(result[0].total_spend).toBe(0)
    expect(result[0].views).toBe(0)
    expect(result[0].ctr).toBeNull()
    expect(result[0].revenue).toBeNull()
  })

  it('empty array returns empty', () => {
    expect(normalizeAdvertisingDailyResponse([])).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// normalizeOrdersCogsResponse
// ---------------------------------------------------------------------------

describe('normalizeOrdersCogsResponse', () => {
  it('happy path: normalizes by_day_with_cogs envelope', () => {
    const raw = {
      by_day_with_cogs: [
        { date: '2025-01-01', cogs: 500 },
        { date: '2025-01-02', cogs: null },
      ],
    }
    const result = normalizeOrdersCogsResponse(raw)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ date: '2025-01-01', cogs: 500 })
    expect(result[1]).toEqual({ date: '2025-01-02', cogs: null })
  })

  it('null input returns empty array', () => {
    expect(normalizeOrdersCogsResponse(null)).toEqual([])
  })

  it('missing by_day_with_cogs returns empty array', () => {
    expect(normalizeOrdersCogsResponse({})).toEqual([])
  })

  it('missing fields default safely', () => {
    const raw = { by_day_with_cogs: [{}] }
    const result = normalizeOrdersCogsResponse(raw)
    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('')
    expect(result[0].cogs).toBeNull()
  })

  it('NaN cogs is coerced to null', () => {
    const raw = { by_day_with_cogs: [{ date: '2025-01-01', cogs: NaN }] }
    const result = normalizeOrdersCogsResponse(raw)
    expect(result[0].cogs).toBeNull()
  })
})
