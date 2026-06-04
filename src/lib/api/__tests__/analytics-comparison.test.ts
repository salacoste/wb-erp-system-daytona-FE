/**
 * Tests for Analytics Comparison API Client (Story 61.5-FE / Epic 61-FE).
 *
 * Implemented from the original TDD red-phase skeleton (iter-157): the it.todo placeholders +
 * commented assertions are now live. Covers getAnalyticsComparison (URL + return shape + errors),
 * buildPeriodRange, deltaToComparison, getChangeDirection/calculateDelta, and comparisonQueryKeys.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock API client
vi.mock('../../api-client', () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from '../../api-client'
import {
  getAnalyticsComparison,
  buildPeriodRange,
  deltaToComparison,
  getChangeDirection,
  calculateDelta,
  comparisonQueryKeys,
} from '../analytics-comparison'

// =============================================================================
// Mock Response Fixtures
// =============================================================================

const mockComparisonResponse = {
  period1: { week: '2026-W05', revenue: 5200000, profit: 1040000, margin_pct: 20.0, orders: 1450 },
  period2: { week: '2026-W04', revenue: 4800000, profit: 864000, margin_pct: 18.0, orders: 1320 },
  delta: {
    revenue: { absolute: 400000, percent: 8.33 },
    profit: { absolute: 176000, percent: 20.37 },
  },
}

const mockComparisonWithBreakdownResponse = {
  ...mockComparisonResponse,
  period1: { ...mockComparisonResponse.period1, week: '2026-W01:W05' },
  period2: { ...mockComparisonResponse.period2, week: '2025-W49:W52' },
  breakdown: [
    { id: '12345678', name: 'Product A', delta_percent: 11.11 },
    { id: '87654321', name: 'Product B', delta_percent: -6.25 },
    { id: '11112222', name: 'Product C', delta_percent: 21.43 },
  ],
}

const mockNegativeDeltaResponse = {
  period1: { week: '2026-W05', revenue: 4000000, profit: 600000 },
  period2: { week: '2026-W04', revenue: 5000000, profit: 1000000 },
  delta: {
    revenue: { absolute: -1000000, percent: -20.0 },
    profit: { absolute: -400000, percent: -40.0 },
  },
}

describe('Analytics Comparison API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAnalyticsComparison', () => {
    it('calls the comparison endpoint with period1/period2 params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockComparisonResponse)
      await getAnalyticsComparison({ period1: '2026-W05', period2: '2026-W04' })
      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('/v1/analytics/weekly/comparison')
      expect(url).toContain('period1=2026-W05')
      expect(url).toContain('period2=2026-W04')
    })

    it('includes groupBy when provided, omits it otherwise', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockComparisonWithBreakdownResponse)
      await getAnalyticsComparison({
        period1: '2026-W01:W05',
        period2: '2025-W49:W52',
        groupBy: 'sku',
      })
      expect(vi.mocked(apiClient.get).mock.calls[0][0]).toContain('groupBy=sku')

      vi.mocked(apiClient.get).mockResolvedValue(mockComparisonResponse)
      await getAnalyticsComparison({ period1: '2026-W05', period2: '2026-W04' })
      expect(vi.mocked(apiClient.get).mock.calls[1][0]).not.toContain('groupBy')
    })

    it('URL-encodes the colon in range periods', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockComparisonWithBreakdownResponse)
      await getAnalyticsComparison({ period1: '2026-W01:W05', period2: '2025-W49:W52' })
      expect(vi.mocked(apiClient.get).mock.calls[0][0]).toContain('period1=2026-W01%3AW05')
    })

    it('returns period1/period2/delta from the response', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockComparisonResponse)
      const result = await getAnalyticsComparison({ period1: '2026-W05', period2: '2026-W04' })
      expect(result.period1.week).toBe('2026-W05')
      expect(result.period1.revenue).toBe(5200000)
      expect(result.period2.week).toBe('2026-W04')
      expect(result.delta.revenue.absolute).toBe(400000)
      expect(result.delta.revenue.percent).toBeCloseTo(8.33, 1)
    })

    it('returns the breakdown array when groupBy is specified', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockComparisonWithBreakdownResponse)
      const result = await getAnalyticsComparison({
        period1: '2026-W01:W05',
        period2: '2025-W49:W52',
        groupBy: 'sku',
      })
      expect(result.breakdown).toHaveLength(3)
      expect(result.breakdown?.[0]?.id).toBe('12345678')
      expect(result.breakdown?.[0]?.delta_percent).toBeCloseTo(11.11, 1)
    })

    it('passes through negative delta values', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockNegativeDeltaResponse)
      const result = await getAnalyticsComparison({ period1: '2026-W05', period2: '2026-W04' })
      expect(result.delta.revenue.absolute).toBe(-1000000)
      expect(result.delta.profit.percent).toBe(-40.0)
    })

    it('propagates API errors to the caller', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('400 INVALID_PERIOD_FORMAT'))
      await expect(
        getAnalyticsComparison({ period1: 'invalid', period2: '2026-W04' })
      ).rejects.toThrow(/INVALID_PERIOD_FORMAT/)
    })
  })

  describe('buildPeriodRange', () => {
    it('returns "" for empty and the single week for length 1', () => {
      expect(buildPeriodRange([])).toBe('')
      expect(buildPeriodRange(['2026-W05'])).toBe('2026-W05')
    })
    it('builds short format within a year (first + last only)', () => {
      expect(buildPeriodRange(['2026-W01', '2026-W02', '2026-W03', '2026-W04', '2026-W05'])).toBe(
        '2026-W01:W05'
      )
      expect(buildPeriodRange(['2026-W01', '2026-W03', '2026-W05'])).toBe('2026-W01:W05') // non-contiguous
    })
    it('builds full format across years', () => {
      expect(buildPeriodRange(['2025-W49', '2025-W50', '2025-W51', '2025-W52', '2026-W01'])).toBe(
        '2025-W49:2026-W01'
      )
      expect(buildPeriodRange(['2026-W52', '2026-W53', '2027-W01'])).toBe('2026-W52:2027-W01')
    })
  })

  describe('deltaToComparison', () => {
    it('maps a positive delta with direction=up', () => {
      const r = deltaToComparison(5200000, 4800000, { absolute: 400000, percent: 8.33 })
      expect(r).toEqual({
        current: 5200000,
        previous: 4800000,
        change: 400000,
        changePercent: 8.33,
        direction: 'up',
      })
    })
    it('maps a negative delta with direction=down', () => {
      const r = deltaToComparison(4000000, 5000000, { absolute: -1000000, percent: -20.0 })
      expect(r.direction).toBe('down')
      expect(r.change).toBe(-1000000)
    })
    it('maps a zero delta with direction=neutral', () => {
      const r = deltaToComparison(500000, 500000, { absolute: 0, percent: 0 })
      expect(r.direction).toBe('neutral')
      expect(r.changePercent).toBe(0)
    })
  })

  describe('getChangeDirection / calculateDelta', () => {
    it('getChangeDirection maps sign → up/down/neutral', () => {
      expect(getChangeDirection({ absolute: 1, percent: 5 })).toBe('up')
      expect(getChangeDirection({ absolute: -1, percent: -3 })).toBe('down')
      expect(getChangeDirection({ absolute: 0, percent: 0 })).toBe('neutral')
    })
    it('calculateDelta computes absolute + percent (|previous| denominator, 0 guard)', () => {
      expect(calculateDelta(120, 100)).toEqual({ absolute: 20, percent: 20 })
      expect(calculateDelta(50, 0)).toEqual({ absolute: 50, percent: 0 })
      expect(calculateDelta(10, -5)).toEqual({ absolute: 15, percent: 300 })
    })
  })

  describe('comparisonQueryKeys', () => {
    it('all / periods / withGroupBy build hierarchical keys', () => {
      expect(comparisonQueryKeys.all).toEqual(['analytics-comparison'])
      expect(comparisonQueryKeys.periods('2026-W05', '2026-W04')).toEqual([
        'analytics-comparison',
        '2026-W05',
        '2026-W04',
      ])
      expect(comparisonQueryKeys.withGroupBy('2026-W05', '2026-W04', 'sku')).toEqual([
        'analytics-comparison',
        '2026-W05',
        '2026-W04',
        'sku',
      ])
    })
    it('different groupBy / period inputs produce distinct keys', () => {
      expect(comparisonQueryKeys.withGroupBy('2026-W05', '2026-W04', 'sku')).not.toEqual(
        comparisonQueryKeys.withGroupBy('2026-W05', '2026-W04', 'brand')
      )
      expect(comparisonQueryKeys.periods('2026-W05', '2026-W04')).not.toEqual(
        comparisonQueryKeys.periods('2026-W01:W05', '2025-W49:W52')
      )
    })
  })
})
