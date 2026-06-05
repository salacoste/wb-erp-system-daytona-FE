/**
 * Boundary Normalizer Tests — Orders Volume
 *
 * Covers normalizeOrdersVolumeResponse and normalizeSeasonalPatternsResponse
 * for null input, missing fields, empty arrays, and full shapes.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeOrdersVolumeResponse,
  normalizeSeasonalPatternsResponse,
} from '../orders-volume-normalizer'

// ---------------------------------------------------------------------------
// normalizeOrdersVolumeResponse
// ---------------------------------------------------------------------------

describe('normalizeOrdersVolumeResponse', () => {
  const fullRaw = {
    total_orders: 5000,
    total_amount: 1500000.5,
    avg_order_value: 300.0,
    by_status: { new: 100, confirm: 200, complete: 4500, cancel: 200 },
    by_day: [
      { date: '2026-01-15', orders: 500, amount: 150000 },
      { date: '2026-01-16', orders: 450, amount: 135000 },
    ],
    by_hour: [{ hour: 10, orders: 80, amount: 24000 }],
  }

  it('maps a full volume response to canonical shape', () => {
    const result = normalizeOrdersVolumeResponse(fullRaw)
    expect(result.total_orders).toBe(5000)
    expect(result.total_amount).toBe(1500000.5)
    expect(result.avg_order_value).toBe(300.0)
    expect(result.by_status.new).toBe(100)
    expect(result.by_status.complete).toBe(4500)
    expect(result.by_day).toHaveLength(2)
    expect(result.by_day![0].date).toBe('2026-01-15')
    expect(result.by_hour).toHaveLength(1)
    expect(result.by_hour![0].hour).toBe(10)
  })

  it('returns safe defaults for null input', () => {
    const result = normalizeOrdersVolumeResponse(null)
    expect(result.total_orders).toBe(0)
    expect(result.total_amount).toBe(0)
    expect(result.avg_order_value).toBe(0)
    expect(result.by_status).toEqual({ new: 0, confirm: 0, complete: 0, cancel: 0 })
    expect(result.by_day).toBeUndefined()
    expect(result.by_hour).toBeUndefined()
  })

  it('returns safe defaults for undefined input', () => {
    const result = normalizeOrdersVolumeResponse(undefined)
    expect(result.total_orders).toBe(0)
  })

  it('handles missing by_day and by_hour as undefined', () => {
    const result = normalizeOrdersVolumeResponse({ total_orders: 10, by_status: {} })
    expect(result.by_day).toBeUndefined()
    expect(result.by_hour).toBeUndefined()
  })

  it('handles empty by_day array', () => {
    const result = normalizeOrdersVolumeResponse({ by_day: [] })
    expect(result.by_day).toEqual([])
  })

  it('handles null money fields (AP#8)', () => {
    const raw = {
      total_orders: 100,
      total_amount: null,
      avg_order_value: null,
      by_status: {},
      by_day: [{ date: '2026-01-15', orders: 10, amount: null }],
    }
    const result = normalizeOrdersVolumeResponse(raw)
    expect(result.total_amount).toBe(0)
    expect(result.avg_order_value).toBe(0)
    expect(result.by_day![0].amount).toBe(0)
  })

  it('accepts camelCase aliases', () => {
    const raw = {
      totalOrders: 100,
      totalAmount: 5000,
      avgOrderValue: 50,
      byStatus: { new: 10, confirm: 20, complete: 60, cancel: 10 },
      byDay: [{ date: '2026-01-15', orders: 50, amount: 2500 }],
    }
    const result = normalizeOrdersVolumeResponse(raw)
    expect(result.total_orders).toBe(100)
    expect(result.total_amount).toBe(5000)
    expect(result.by_status.new).toBe(10)
    expect(result.by_day).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// normalizeSeasonalPatternsResponse
// ---------------------------------------------------------------------------

describe('normalizeSeasonalPatternsResponse', () => {
  const fullRaw = {
    patterns: {
      monthly: [
        { month: 'January', avgOrders: 500, avgRevenue: 150000 },
        { month: 'February', avgOrders: 450, avgRevenue: 135000 },
      ],
      weekday: [{ dayOfWeek: 'Monday', avgOrders: 80, peakHour: 14 }],
    },
    insights: { peakMonth: 'November', lowMonth: 'February', peakDay: 'Saturday' },
  }

  it('maps a full seasonal response to canonical shape', () => {
    const result = normalizeSeasonalPatternsResponse(fullRaw)
    expect(result.patterns.monthly).toHaveLength(2)
    expect(result.patterns.monthly[0].month).toBe('January')
    expect(result.patterns.monthly[0].avgOrders).toBe(500)
    expect(result.patterns.weekday).toHaveLength(1)
    expect(result.patterns.weekday[0].peakHour).toBe(14)
    expect(result.insights.peakMonth).toBe('November')
  })

  it('returns safe defaults for null input', () => {
    const result = normalizeSeasonalPatternsResponse(null)
    expect(result.patterns.monthly).toEqual([])
    expect(result.patterns.weekday).toEqual([])
    expect(result.insights).toEqual({ peakMonth: '', lowMonth: '', peakDay: '' })
  })

  it('returns safe defaults for undefined input', () => {
    const result = normalizeSeasonalPatternsResponse(undefined)
    expect(result.patterns.monthly).toEqual([])
  })

  it('handles empty arrays', () => {
    const result = normalizeSeasonalPatternsResponse({
      patterns: { monthly: [], weekday: [] },
      insights: {},
    })
    expect(result.patterns.monthly).toEqual([])
    expect(result.patterns.weekday).toEqual([])
  })

  it('handles null revenue fields (AP#8)', () => {
    const raw = {
      patterns: {
        monthly: [{ month: 'Jan', avgOrders: 0, avgRevenue: null }],
        weekday: [],
      },
      insights: {},
    }
    const result = normalizeSeasonalPatternsResponse(raw)
    expect(result.patterns.monthly[0].avgRevenue).toBe(0)
  })
})
