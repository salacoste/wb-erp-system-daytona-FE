/**
 * Boundary Normalizer Tests — Buyout Daily Trend
 *
 * Covers normalizeBuyoutDailyResponse for null input,
 * missing fields, empty arrays, and full shapes.
 */

import { describe, it, expect } from 'vitest'
import { normalizeBuyoutDailyResponse } from '../buyout-daily-normalizer'

describe('normalizeBuyoutDailyResponse', () => {
  it('maps a full response to canonical shape', () => {
    const raw = {
      daily: [
        {
          date: '2026-01-01',
          buyoutRate: 85.2,
          returnRate: 14.8,
          ordersCount: 120,
          returnsCount: 18,
        },
        {
          date: '2026-01-02',
          buyoutRate: null,
          returnRate: null,
          ordersCount: 0,
          returnsCount: 0,
        },
      ],
      period: { from: '2026-01-01', to: '2026-01-02' },
      summary: {
        avgBuyoutRate: 85.2,
        avgReturnRate: 14.8,
        totalOrders: 120,
        totalReturns: 18,
      },
    }

    const result = normalizeBuyoutDailyResponse(raw)

    expect(result.daily).toHaveLength(2)
    expect(result.daily[0].date).toBe('2026-01-01')
    expect(result.daily[0].buyoutRate).toBe(85.2)
    expect(result.daily[0].ordersCount).toBe(120)
    expect(result.daily[1].buyoutRate).toBeNull()
    expect(result.period.from).toBe('2026-01-01')
    expect(result.summary.avgBuyoutRate).toBe(85.2)
    expect(result.summary.totalOrders).toBe(120)
  })

  it('returns safe defaults for null input', () => {
    const result = normalizeBuyoutDailyResponse(null)
    expect(result.daily).toEqual([])
    expect(result.period).toEqual({ from: '', to: '' })
    expect(result.summary.avgBuyoutRate).toBeNull()
    expect(result.summary.totalOrders).toBe(0)
  })

  it('returns safe defaults for undefined input', () => {
    const result = normalizeBuyoutDailyResponse(undefined)
    expect(result.daily).toEqual([])
  })

  it('handles missing fields on daily items', () => {
    const raw = { daily: [{}], period: {}, summary: {} }
    const result = normalizeBuyoutDailyResponse(raw)
    const item = result.daily[0]
    expect(item.date).toBe('')
    expect(item.buyoutRate).toBeNull()
    expect(item.returnRate).toBeNull()
    expect(item.ordersCount).toBe(0)
    expect(item.returnsCount).toBe(0)
  })

  it('handles empty daily array', () => {
    const result = normalizeBuyoutDailyResponse({ daily: [] })
    expect(result.daily).toEqual([])
  })

  it('handles non-array daily as empty', () => {
    const result = normalizeBuyoutDailyResponse({ daily: 'not-array' })
    expect(result.daily).toEqual([])
  })

  it('handles null money/ratio fields as null (AP#8)', () => {
    const raw = {
      daily: [{ buyoutRate: null, returnRate: null }],
      summary: { avgBuyoutRate: null, avgReturnRate: null },
    }
    const result = normalizeBuyoutDailyResponse(raw)
    expect(result.daily[0].buyoutRate).toBeNull()
    expect(result.daily[0].returnRate).toBeNull()
    expect(result.summary.avgBuyoutRate).toBeNull()
    expect(result.summary.avgReturnRate).toBeNull()
  })

  it('accepts snake_case field names', () => {
    const raw = {
      daily: [
        {
          date: '2026-01-01',
          buyout_rate: 75.0,
          return_rate: 25.0,
          orders_count: 50,
          returns_count: 12,
        },
      ],
      period: { from: '2026-01-01', to: '2026-01-01' },
      summary: {
        avg_buyout_rate: 75.0,
        avg_return_rate: 25.0,
        total_orders: 50,
        total_returns: 12,
      },
    }
    const result = normalizeBuyoutDailyResponse(raw)
    expect(result.daily[0].buyoutRate).toBe(75.0)
    expect(result.daily[0].ordersCount).toBe(50)
    expect(result.summary.avgBuyoutRate).toBe(75.0)
    expect(result.summary.totalOrders).toBe(50)
  })
})
