/**
 * FBS Analytics Boundary Normalizer Tests
 * Tests for normalizeTrendsResponse, normalizeSeasonalResponse,
 * normalizeCompareResponse from fbs-analytics-normalizer.ts
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeTrendsResponse,
  normalizeSeasonalResponse,
  normalizeCompareResponse,
} from '../fbs-analytics-normalizer'

// --- normalizeTrendsResponse ---

describe('normalizeTrendsResponse', () => {
  it('normalizes a fully-populated trends response', () => {
    const raw = {
      trends: [
        {
          date: '2026-01-15',
          ordersCount: 42,
          revenue: 150000,
          cancellations: 3,
          returns: 2,
          avgOrderValue: 3571,
        },
      ],
      period: { from: '2026-01-01', to: '2026-01-31', daysIncluded: 28 },
    }
    const result = normalizeTrendsResponse(raw)
    expect(result.trends).toHaveLength(1)
    expect(result.trends[0].date).toBe('2026-01-15')
    expect(result.trends[0].ordersCount).toBe(42)
    expect(result.trends[0].revenue).toBe(150000)
  })

  it('handles snake_case orders_count field', () => {
    const raw = {
      trends: [{ orders_count: 10 }],
      period: { from: 'a', to: 'b', days_included: 7 },
    }
    const result = normalizeTrendsResponse(raw)
    expect(result.trends[0].ordersCount).toBe(10)
  })

  it('avgOrderValue defaults to 0 when only avg_order_value present (not mapped)', () => {
    const raw = {
      trends: [{ avg_order_value: 500 }],
      period: { from: 'a', to: 'b' },
    }
    const result = normalizeTrendsResponse(raw)
    // normalizer does NOT alias avg_order_value → avgOrderValue
    expect(result.trends[0].avgOrderValue).toBe(0)
  })

  it('handles snake_case period field days_included', () => {
    const raw = {
      trends: [],
      period: { from: 'a', to: 'b', days_included: 14 },
    }
    const result = normalizeTrendsResponse(raw)
    expect(result.period.daysIncluded).toBe(14)
  })

  it('coerces null revenue to 0 (BACKEND-CONTRACT-NON-NULL)', () => {
    const raw = {
      trends: [{ date: '2026-02-01', revenue: null, avgOrderValue: null }],
      period: { from: 'a', to: 'b' },
    }
    const result = normalizeTrendsResponse(raw)
    expect(result.trends[0].revenue).toBe(0)
    expect(result.trends[0].avgOrderValue).toBe(0)
  })

  it('defaults missing trend fields to 0', () => {
    const raw = { trends: [{}], period: {} }
    const trend = normalizeTrendsResponse(raw).trends[0]
    expect(trend.ordersCount).toBe(0)
    expect(trend.revenue).toBe(0)
    expect(trend.cancellations).toBe(0)
    expect(trend.returns).toBe(0)
    expect(trend.avgOrderValue).toBe(0)
  })

  it('defaults date to empty string when missing', () => {
    const raw = { trends: [{}], period: {} }
    expect(normalizeTrendsResponse(raw).trends[0].date).toBe('')
  })

  it('defaults trends to empty array when missing', () => {
    const result = normalizeTrendsResponse({})
    expect(result.trends).toEqual([])
  })

  it('defaults period to empty strings when missing', () => {
    const result = normalizeTrendsResponse({})
    expect(result.period.from).toBe('')
    expect(result.period.to).toBe('')
    expect(result.period.daysIncluded).toBe(0)
  })

  it('returns safe defaults for null/undefined raw', () => {
    const result = normalizeTrendsResponse(null)
    expect(result.trends).toEqual([])
    expect(result.period.from).toBe('')
  })
})

// --- normalizeSeasonalResponse ---

describe('normalizeSeasonalResponse', () => {
  it('passes through a fully-populated seasonal response', () => {
    const raw = {
      patterns: {
        monthly: { peak: 'March', avgOrders: 200 },
        weekday: { peak: 'Tuesday' },
        quarterly: null,
      },
      summary: { totalPatterns: 3 },
    }
    const result = normalizeSeasonalResponse(raw) as unknown as Record<string, unknown>
    expect((result.patterns as Record<string, unknown>).monthly).toEqual({
      peak: 'March',
      avgOrders: 200,
    })
    expect(result.summary).toEqual({ totalPatterns: 3 })
  })

  it('defaults patterns when missing', () => {
    const result = normalizeSeasonalResponse({}) as unknown as Record<string, unknown>
    expect(result.patterns).toEqual({ monthly: null, weekday: null, quarterly: null })
  })

  it('defaults patterns to null objects when null', () => {
    const result = normalizeSeasonalResponse({ patterns: null }) as unknown as Record<
      string,
      unknown
    >
    expect(result.patterns).toEqual({ monthly: null, weekday: null, quarterly: null })
  })

  it('defaults summary to empty object when missing', () => {
    const result = normalizeSeasonalResponse({}) as unknown as Record<string, unknown>
    expect(result.summary).toEqual({})
  })

  it('returns safe defaults for null/undefined raw', () => {
    const result = normalizeSeasonalResponse(null) as unknown as Record<string, unknown>
    expect(result.patterns).toEqual({ monthly: null, weekday: null, quarterly: null })
  })
})

// --- normalizeCompareResponse ---

describe('normalizeCompareResponse', () => {
  it('normalizes a fully-populated compare response', () => {
    const raw = {
      comparison: {
        ordersChangePercent: 15.5,
        revenueChangePercent: -3.2,
        currentPeriod: { orders: 100, revenue: 500000 },
        previousPeriod: { orders: 87, revenue: 516000 },
      },
    }
    const result = normalizeCompareResponse(raw)
    expect(result.comparison.ordersChangePercent).toBe(15.5)
    expect(result.comparison.revenueChangePercent).toBe(-3.2)
  })

  it('handles snake_case change percent fields', () => {
    const raw = {
      comparison: {
        orders_change_percent: 25,
        revenue_change_percent: -10,
      },
    }
    const result = normalizeCompareResponse(raw)
    expect(result.comparison.ordersChangePercent).toBe(25)
    expect(result.comparison.revenueChangePercent).toBe(-10)
  })

  it('defaults change percents to 0 when missing', () => {
    const raw = { comparison: {} }
    const result = normalizeCompareResponse(raw)
    expect(result.comparison.ordersChangePercent).toBe(0)
    expect(result.comparison.revenueChangePercent).toBe(0)
  })

  it('preserves extra fields on comparison', () => {
    const raw = {
      comparison: {
        ordersChangePercent: 5,
        customField: 'preserved',
      },
    }
    const result = normalizeCompareResponse(raw)
    expect((result.comparison as unknown as Record<string, unknown>).customField).toBe('preserved')
  })

  it('returns safe defaults for null/undefined raw', () => {
    const result = normalizeCompareResponse(null)
    expect(result.comparison.ordersChangePercent).toBe(0)
    expect(result.comparison.revenueChangePercent).toBe(0)
  })
})
