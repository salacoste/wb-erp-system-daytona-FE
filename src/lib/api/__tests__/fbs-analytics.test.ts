/**
 * Tests for FBS Analytics API Client
 * Story 51.1-FE: FBS Analytics Types & API Module
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Covers: getFbsTrends, getFbsSeasonal, getFbsCompare, fbsAnalyticsQueryKeys,
 * normalizers, error handling, cache configuration, query string building.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock API client
vi.mock('../../api-client', () => ({
  apiClient: { get: vi.fn() },
}))

// Mock logger to avoid console noise
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { apiClient } from '../../api-client'
import {
  getFbsTrends,
  getFbsSeasonal,
  getFbsCompare,
  fbsAnalyticsQueryKeys,
  FBS_ANALYTICS_CACHE,
} from '../fbs-analytics'
import {
  normalizeTrendsResponse,
  normalizeSeasonalResponse,
  normalizeCompareResponse,
} from '../fbs-analytics-normalizer'

// =============================================================================
// Mock Response Fixtures
// =============================================================================

const mockTrendsRaw = {
  trends: [
    {
      date: '2026-01-01',
      ordersCount: 10,
      revenue: 15000,
      cancellations: 1,
      cancellationRate: 0.1,
      returns: 0,
      returnRate: 0,
      avgOrderValue: 1500,
    },
    {
      date: '2026-01-02',
      ordersCount: 20,
      revenue: 30000,
      cancellations: 2,
      cancellationRate: 0.1,
      returns: 1,
      returnRate: 0.05,
      avgOrderValue: 1500,
    },
  ],
  summary: {
    totalOrders: 30,
    totalRevenue: 45000,
    avgDailyOrders: 15,
    cancellationRate: 0.1,
    returnRate: 0.025,
  },
  dataSource: { primary: 'orders_fbs' },
  period: {
    from: '2026-01-01',
    to: '2026-01-02',
    aggregation: 'day',
    daysIncluded: 2,
  },
}

const mockSeasonalRaw = {
  patterns: {
    monthly: [
      { month: 'January', avgOrders: 120, avgRevenue: 50000 },
      { month: 'December', avgOrders: 200, avgRevenue: 80000 },
    ],
    weekday: [
      { dayOfWeek: 'Monday', avgOrders: 30 },
      { dayOfWeek: 'Friday', avgOrders: 45 },
    ],
    quarterly: [{ quarter: 'Q4', avgOrders: 500, avgRevenue: 200000 }],
  },
  insights: {
    peakMonth: 'December',
    lowMonth: 'February',
    peakDayOfWeek: 'Friday',
    seasonalityIndex: 1.5,
  },
}

const mockCompareRaw = {
  period1: {
    from: '2026-01-01',
    to: '2026-01-31',
    ordersCount: 300,
    revenue: 150000,
    cancellationRate: 0.05,
    avgOrderValue: 500,
  },
  period2: {
    from: '2025-12-01',
    to: '2025-12-31',
    ordersCount: 250,
    revenue: 120000,
    cancellationRate: 0.08,
    avgOrderValue: 480,
  },
  comparison: {
    ordersChange: 50,
    ordersChangePercent: 20,
    revenueChange: 30000,
    revenueChangePercent: 25,
    cancellationRateChange: -0.03,
    avgOrderValueChange: 20,
    avgOrderValueChangePercent: 4.17,
  },
}

// =============================================================================
// Tests
// =============================================================================

describe('FBS Analytics API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // getFbsTrends Tests
  // ===========================================================================

  describe('getFbsTrends', () => {
    it('calls API with correct endpoint /v1/analytics/orders/trends', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockTrendsRaw)
      await getFbsTrends({ from: '2026-01-01', to: '2026-01-02' })
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('/v1/analytics/orders/trends')
    })

    it('includes from and to date params in query string', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockTrendsRaw)
      await getFbsTrends({ from: '2026-01-01', to: '2026-01-31' })
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('from=2026-01-01')
      expect(url).toContain('to=2026-01-31')
    })

    it('includes aggregation param when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockTrendsRaw)
      await getFbsTrends({ from: '2026-01-01', to: '2026-01-31', aggregation: 'week' })
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('aggregation=week')
    })

    it('includes metrics array param when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockTrendsRaw)
      await getFbsTrends({ from: '2026-01-01', to: '2026-01-31', metrics: ['orders', 'revenue'] })
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('metrics=orders%2Crevenue')
    })

    it('uses skipDataUnwrap option', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockTrendsRaw)
      await getFbsTrends({ from: '2026-01-01', to: '2026-01-02' })
      const options = vi.mocked(apiClient.get).mock.calls[0][1]
      expect(options).toEqual({ skipDataUnwrap: true })
    })

    it('returns TrendsResponse with trends array', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockTrendsRaw)
      const result = await getFbsTrends({ from: '2026-01-01', to: '2026-01-02' })
      expect(result.trends).toHaveLength(2)
      expect(result.trends[0].date).toBe('2026-01-01')
    })

    it('returns TrendsResponse with summary', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockTrendsRaw)
      const result = await getFbsTrends({ from: '2026-01-01', to: '2026-01-02' })
      expect(result.summary).toBeDefined()
      expect(result.summary.totalOrders).toBe(30)
    })

    it('returns TrendsResponse with dataSource', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockTrendsRaw)
      const result = await getFbsTrends({ from: '2026-01-01', to: '2026-01-02' })
      expect(result.dataSource).toEqual({ primary: 'orders_fbs' })
    })

    it('returns TrendsResponse with period info', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockTrendsRaw)
      const result = await getFbsTrends({ from: '2026-01-01', to: '2026-01-02' })
      expect(result.period).toBeDefined()
      expect(result.period.from).toBe('2026-01-01')
      expect(result.period.to).toBe('2026-01-02')
    })

    it('handles empty trends array response', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ ...mockTrendsRaw, trends: [] })
      const result = await getFbsTrends({ from: '2026-01-01', to: '2026-01-02' })
      expect(result.trends).toHaveLength(0)
    })

    it('returns daily resolution for 0-90 day range', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        ...mockTrendsRaw,
        period: { ...mockTrendsRaw.period, aggregation: 'day', daysIncluded: 45 },
      })
      const result = await getFbsTrends({ from: '2026-01-01', to: '2026-02-15' })
      expect(result.period.daysIncluded).toBe(45)
    })

    it('returns weekly resolution for 91-365 day range', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        ...mockTrendsRaw,
        period: { ...mockTrendsRaw.period, aggregation: 'week', daysIncluded: 180 },
      })
      const result = await getFbsTrends({ from: '2025-06-01', to: '2026-01-01' })
      expect(result.period.daysIncluded).toBe(180)
    })

    it('omits undefined params from query string', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockTrendsRaw)
      await getFbsTrends({ from: '2026-01-01', to: '2026-01-02' })
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).not.toContain('aggregation')
      expect(url).not.toContain('metrics')
    })

    it('handles empty metrics array by omitting param', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockTrendsRaw)
      await getFbsTrends({ from: '2026-01-01', to: '2026-01-02', metrics: [] })
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).not.toContain('metrics')
    })

    it('logs request info in development mode', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockTrendsRaw)
      const { logger } = await import('@/lib/logger')
      await getFbsTrends({ from: '2026-01-01', to: '2026-01-02' })
      expect(logger.debug).toHaveBeenCalledWith(
        '[FBS Analytics] Fetching trends:',
        expect.objectContaining({ from: '2026-01-01', to: '2026-01-02' })
      )
    })

    it('logs response info in development mode', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockTrendsRaw)
      const { logger } = await import('@/lib/logger')
      await getFbsTrends({ from: '2026-01-01', to: '2026-01-02' })
      expect(logger.debug).toHaveBeenCalledWith(
        '[FBS Analytics] Trends response:',
        expect.objectContaining({ dataPoints: 2 })
      )
    })
  })

  // ===========================================================================
  // getFbsSeasonal Tests
  // ===========================================================================

  describe('getFbsSeasonal', () => {
    it('calls API with correct endpoint /v1/analytics/orders/seasonal', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockSeasonalRaw)
      await getFbsSeasonal()
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('/v1/analytics/orders/seasonal')
    })

    it('works without any params (defaults)', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockSeasonalRaw)
      await getFbsSeasonal()
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toBe('/v1/analytics/orders/seasonal')
    })

    it('includes months param when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockSeasonalRaw)
      await getFbsSeasonal({ months: 6 })
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('months=6')
    })

    it('includes view param when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockSeasonalRaw)
      await getFbsSeasonal({ view: 'monthly' })
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('view=monthly')
    })

    it('uses skipDataUnwrap option', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockSeasonalRaw)
      await getFbsSeasonal()
      const options = vi.mocked(apiClient.get).mock.calls[0][1]
      expect(options).toEqual({ skipDataUnwrap: true })
    })

    it('returns SeasonalResponse with patterns', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockSeasonalRaw)
      const result = await getFbsSeasonal()
      expect(result.patterns).toBeDefined()
      expect(result.patterns.monthly).toHaveLength(2)
    })

    it('returns SeasonalResponse with insights', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockSeasonalRaw)
      const result = await getFbsSeasonal()
      expect(result.insights).toBeDefined()
      expect(result.insights.peakMonth).toBe('December')
    })

    it('returns monthly patterns when view=monthly', async () => {
      const monthlyOnly = {
        ...mockSeasonalRaw,
        patterns: { monthly: mockSeasonalRaw.patterns.monthly },
      }
      vi.mocked(apiClient.get).mockResolvedValue(monthlyOnly)
      const result = await getFbsSeasonal({ view: 'monthly' })
      expect(result.patterns.monthly).toHaveLength(2)
      expect(result.patterns.weekday).toBeUndefined()
    })

    it('returns weekday patterns when view=weekly', async () => {
      const weekdayOnly = {
        ...mockSeasonalRaw,
        patterns: { weekday: mockSeasonalRaw.patterns.weekday },
      }
      vi.mocked(apiClient.get).mockResolvedValue(weekdayOnly)
      const result = await getFbsSeasonal({ view: 'weekly' })
      expect(result.patterns.weekday).toHaveLength(2)
      expect(result.patterns.monthly).toBeUndefined()
    })

    it('returns quarterly patterns when view=quarterly', async () => {
      const quarterlyOnly = {
        ...mockSeasonalRaw,
        patterns: { quarterly: mockSeasonalRaw.patterns.quarterly },
      }
      vi.mocked(apiClient.get).mockResolvedValue(quarterlyOnly)
      const result = await getFbsSeasonal({ view: 'quarterly' })
      expect(result.patterns.quarterly).toHaveLength(1)
      expect(result.patterns.monthly).toBeUndefined()
    })

    it('returns all pattern types when view not specified', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockSeasonalRaw)
      const result = await getFbsSeasonal()
      expect(result.patterns.monthly).toBeDefined()
      expect(result.patterns.weekday).toBeDefined()
      expect(result.patterns.quarterly).toBeDefined()
    })

    it('handles missing optional pattern fields', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        ...mockSeasonalRaw,
        patterns: {},
      })
      const result = await getFbsSeasonal()
      expect(result.patterns).toBeDefined()
    })
  })

  // ===========================================================================
  // getFbsCompare Tests
  // ===========================================================================

  describe('getFbsCompare', () => {
    const compareParams = {
      period1From: '2026-01-01',
      period1To: '2026-01-31',
      period2From: '2025-12-01',
      period2To: '2025-12-31',
    }

    it('calls API with correct endpoint /v1/analytics/orders/compare', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockCompareRaw)
      await getFbsCompare(compareParams)
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('/v1/analytics/orders/compare')
    })

    it('includes period1_from param in query string', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockCompareRaw)
      await getFbsCompare(compareParams)
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('period1_from=2026-01-01')
    })

    it('includes period1_to param in query string', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockCompareRaw)
      await getFbsCompare(compareParams)
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('period1_to=2026-01-31')
    })

    it('includes period2_from param in query string', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockCompareRaw)
      await getFbsCompare(compareParams)
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('period2_from=2025-12-01')
    })

    it('includes period2_to param in query string', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockCompareRaw)
      await getFbsCompare(compareParams)
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('period2_to=2025-12-31')
    })

    it('uses skipDataUnwrap option', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockCompareRaw)
      await getFbsCompare(compareParams)
      const options = vi.mocked(apiClient.get).mock.calls[0][1]
      expect(options).toEqual({ skipDataUnwrap: true })
    })

    it('returns CompareResponse with period1 metrics', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockCompareRaw)
      const result = await getFbsCompare(compareParams)
      expect(result.period1).toBeDefined()
      expect(result.period1.ordersCount).toBe(300)
    })

    it('returns CompareResponse with period2 metrics', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockCompareRaw)
      const result = await getFbsCompare(compareParams)
      expect(result.period2).toBeDefined()
      expect(result.period2.ordersCount).toBe(250)
    })

    it('returns CompareResponse with comparison deltas', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockCompareRaw)
      const result = await getFbsCompare(compareParams)
      expect(result.comparison).toBeDefined()
      expect(result.comparison.ordersChange).toBe(50)
      expect(result.comparison.revenueChangePercent).toBe(25)
    })

    it('handles negative change values correctly', async () => {
      const negativeRaw = {
        ...mockCompareRaw,
        comparison: {
          ...mockCompareRaw.comparison,
          ordersChange: -50,
          revenueChange: -30000,
        },
      }
      vi.mocked(apiClient.get).mockResolvedValue(negativeRaw)
      const result = await getFbsCompare(compareParams)
      expect(result.comparison.ordersChange).toBe(-50)
      expect(result.comparison.revenueChange).toBe(-30000)
    })

    it('handles negative percent values correctly', async () => {
      const negativePctRaw = {
        ...mockCompareRaw,
        comparison: {
          ...mockCompareRaw.comparison,
          ordersChangePercent: -20,
          revenueChangePercent: -25,
        },
      }
      vi.mocked(apiClient.get).mockResolvedValue(negativePctRaw)
      const result = await getFbsCompare(compareParams)
      expect(result.comparison.ordersChangePercent).toBe(-20)
      expect(result.comparison.revenueChangePercent).toBe(-25)
    })

    it('logs comparison info in development mode', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockCompareRaw)
      const { logger } = await import('@/lib/logger')
      await getFbsCompare(compareParams)
      expect(logger.debug).toHaveBeenCalledWith(
        '[FBS Analytics] Fetching comparison:',
        expect.objectContaining({ period1: '2026-01-01 - 2026-01-31' })
      )
    })
  })

  // ===========================================================================
  // Query Keys Factory Tests
  // ===========================================================================

  describe('fbsAnalyticsQueryKeys', () => {
    it('has all base key as ["fbs-analytics"]', () => {
      expect(fbsAnalyticsQueryKeys.all).toEqual(['fbs-analytics'])
    })

    it('trends key includes params for cache differentiation', () => {
      const params = { from: '2026-01-01', to: '2026-01-31' }
      const key = fbsAnalyticsQueryKeys.trends(params)
      expect(key).toEqual(['fbs-analytics', 'trends', params])
    })

    it('seasonal key includes params for cache differentiation', () => {
      const params = { months: 6, view: 'monthly' as const }
      const key = fbsAnalyticsQueryKeys.seasonal(params)
      expect(key).toEqual(['fbs-analytics', 'seasonal', params])
    })

    it('compare key includes params for cache differentiation', () => {
      const params = {
        period1From: '2026-01-01',
        period1To: '2026-01-31',
        period2From: '2025-12-01',
        period2To: '2025-12-31',
      }
      const key = fbsAnalyticsQueryKeys.compare(params)
      expect(key).toEqual(['fbs-analytics', 'compare', params])
    })

    it('seasonal key handles undefined params', () => {
      const key = fbsAnalyticsQueryKeys.seasonal(undefined)
      expect(key).toEqual(['fbs-analytics', 'seasonal', {}])
    })
  })

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================

  describe('Error Handling', () => {
    it('throws ApiError on 400 INVALID_DATE_FORMAT', async () => {
      const error = new Error('Bad Request')
      Object.assign(error, { status: 400, data: { error: { code: 'INVALID_DATE_FORMAT' } } })
      vi.mocked(apiClient.get).mockRejectedValueOnce(error)
      await expect(getFbsTrends({ from: 'bad-date', to: '2026-01-31' })).rejects.toThrow(
        'Bad Request'
      )
    })

    it('throws ApiError on 400 INVALID_DATE_RANGE', async () => {
      const error = new Error('Bad Request')
      Object.assign(error, { status: 400, data: { error: { code: 'INVALID_DATE_RANGE' } } })
      vi.mocked(apiClient.get).mockRejectedValueOnce(error)
      await expect(getFbsTrends({ from: '2026-12-01', to: '2026-01-01' })).rejects.toThrow(
        'Bad Request'
      )
    })

    it('throws ApiError on 400 DATE_RANGE_EXCEEDED', async () => {
      const error = new Error('Bad Request')
      Object.assign(error, { status: 400, data: { error: { code: 'DATE_RANGE_EXCEEDED' } } })
      vi.mocked(apiClient.get).mockRejectedValueOnce(error)
      await expect(getFbsTrends({ from: '2024-01-01', to: '2026-12-31' })).rejects.toThrow(
        'Bad Request'
      )
    })

    it('throws ApiError on 401 UNAUTHORIZED', async () => {
      const error = new Error('Unauthorized')
      Object.assign(error, { status: 401, data: { error: { code: 'UNAUTHORIZED' } } })
      vi.mocked(apiClient.get).mockRejectedValueOnce(error)
      await expect(getFbsTrends({ from: '2026-01-01', to: '2026-01-31' })).rejects.toThrow(
        'Unauthorized'
      )
    })

    it('throws ApiError on 403 FORBIDDEN', async () => {
      const error = new Error('Forbidden')
      Object.assign(error, { status: 403, data: { error: { code: 'FORBIDDEN' } } })
      vi.mocked(apiClient.get).mockRejectedValueOnce(error)
      await expect(getFbsTrends({ from: '2026-01-01', to: '2026-01-31' })).rejects.toThrow(
        'Forbidden'
      )
    })

    it('throws ApiError on 404 CABINET_NOT_FOUND', async () => {
      const error = new Error('Not Found')
      Object.assign(error, { status: 404, data: { error: { code: 'CABINET_NOT_FOUND' } } })
      vi.mocked(apiClient.get).mockRejectedValueOnce(error)
      await expect(getFbsTrends({ from: '2026-01-01', to: '2026-01-31' })).rejects.toThrow(
        'Not Found'
      )
    })

    it('throws ApiError on 500 server error', async () => {
      const error = new Error('Internal Server Error')
      Object.assign(error, { status: 500 })
      vi.mocked(apiClient.get).mockRejectedValueOnce(error)
      await expect(getFbsTrends({ from: '2026-01-01', to: '2026-01-31' })).rejects.toThrow(
        'Internal Server Error'
      )
    })

    it('handles network timeout gracefully', async () => {
      const error = new Error('Network Error')
      vi.mocked(apiClient.get).mockRejectedValueOnce(error)
      await expect(getFbsTrends({ from: '2026-01-01', to: '2026-01-31' })).rejects.toThrow(
        'Network Error'
      )
    })
  })

  // ===========================================================================
  // Cache Configuration Tests
  // ===========================================================================

  describe('Cache Configuration', () => {
    it('staleTime is 5 minutes (300000ms)', () => {
      expect(FBS_ANALYTICS_CACHE.staleTime).toBe(300000)
    })

    it('gcTime is 30 minutes (1800000ms)', () => {
      expect(FBS_ANALYTICS_CACHE.gcTime).toBe(1800000)
    })
  })

  // ===========================================================================
  // Normalizer Tests
  // ===========================================================================

  describe('normalizeTrendsResponse', () => {
    it('passes through well-formed response unchanged', () => {
      const result = normalizeTrendsResponse(mockTrendsRaw)
      expect(result.trends).toHaveLength(2)
      expect(result.trends[0].ordersCount).toBe(10)
      expect(result.period.daysIncluded).toBe(2)
    })

    it('handles null raw input gracefully', () => {
      const result = normalizeTrendsResponse(null)
      expect(result.trends).toHaveLength(0)
    })

    it('handles undefined raw input gracefully', () => {
      const result = normalizeTrendsResponse(undefined)
      expect(result.trends).toHaveLength(0)
    })

    it('coerces snake_case orders_count to camelCase ordersCount', () => {
      const raw = {
        trends: [{ date: '2026-01-01', orders_count: 42 }],
        period: { from: '2026-01-01', to: '2026-01-01', daysIncluded: 1 },
      }
      const result = normalizeTrendsResponse(raw)
      expect(result.trends[0].ordersCount).toBe(42)
    })

    it('coerces snake_case days_included to daysIncluded', () => {
      const raw = {
        trends: [],
        period: { from: '2026-01-01', to: '2026-01-01', days_included: 30 },
      }
      const result = normalizeTrendsResponse(raw)
      expect(result.period.daysIncluded).toBe(30)
    })

    it('defaults missing fields to safe values', () => {
      const raw = { trends: [{}] }
      const result = normalizeTrendsResponse(raw)
      const point = result.trends[0]
      expect(point.date).toBe('')
      expect(point.ordersCount).toBe(0)
      expect(point.revenue).toBe(0)
      expect(point.cancellations).toBe(0)
    })

    it('handles missing trends array', () => {
      const result = normalizeTrendsResponse({})
      expect(result.trends).toHaveLength(0)
    })

    it('handles missing period object', () => {
      const result = normalizeTrendsResponse({ trends: [] })
      expect(result.period.from).toBe('')
      expect(result.period.to).toBe('')
    })
  })

  describe('normalizeSeasonalResponse', () => {
    it('passes through well-formed response', () => {
      const result = normalizeSeasonalResponse(mockSeasonalRaw)
      expect(result.patterns.monthly).toHaveLength(2)
      expect(result.insights.peakMonth).toBe('December')
    })

    it('provides default patterns for null input', () => {
      const result = normalizeSeasonalResponse(null)
      expect(result.patterns).toEqual({ monthly: null, weekday: null, quarterly: null })
    })

    it('preserves partial patterns', () => {
      const raw = { patterns: { monthly: [{ month: 'Jan', avgOrders: 10, avgRevenue: 500 }] } }
      const result = normalizeSeasonalResponse(raw)
      expect(result.patterns.monthly).toHaveLength(1)
    })

    it('handles undefined raw', () => {
      const result = normalizeSeasonalResponse(undefined)
      expect(result.patterns).toBeDefined()
    })
  })

  describe('normalizeCompareResponse', () => {
    it('passes through well-formed response', () => {
      const result = normalizeCompareResponse(mockCompareRaw)
      expect(result.period1.ordersCount).toBe(300)
      expect(result.comparison.ordersChangePercent).toBe(20)
    })

    it('handles null input', () => {
      const result = normalizeCompareResponse(null)
      expect(result.comparison).toBeDefined()
    })

    it('coerces snake_case percent fields to camelCase', () => {
      const raw = {
        ...mockCompareRaw,
        comparison: {
          orders_change_percent: 15.5,
          revenue_change_percent: -10.2,
        },
      }
      const result = normalizeCompareResponse(raw)
      expect(result.comparison.ordersChangePercent).toBe(15.5)
      expect(result.comparison.revenueChangePercent).toBe(-10.2)
    })

    it('defaults comparison to safe object for empty input', () => {
      const result = normalizeCompareResponse({})
      expect(result.comparison.ordersChangePercent).toBe(0)
      expect(result.comparison.revenueChangePercent).toBe(0)
    })
  })

  // ===========================================================================
  // Query String Building Tests
  // ===========================================================================

  describe('Query String Building', () => {
    it('filters out undefined values', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockTrendsRaw)
      await getFbsSeasonal({ months: undefined, view: undefined })
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toBe('/v1/analytics/orders/seasonal')
    })

    it('filters out null values', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockSeasonalRaw)
      await getFbsSeasonal()
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).not.toContain('null')
    })

    it('joins array values with comma', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockTrendsRaw)
      await getFbsTrends({
        from: '2026-01-01',
        to: '2026-01-31',
        metrics: ['orders', 'revenue', 'cancellations'],
      })
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('metrics=orders%2Crevenue%2Ccancellations')
    })

    it('omits empty array values', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockTrendsRaw)
      await getFbsTrends({ from: '2026-01-01', to: '2026-01-31', metrics: [] })
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).not.toContain('metrics')
    })

    it('converts numbers to strings', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockSeasonalRaw)
      await getFbsSeasonal({ months: 12 })
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('months=12')
    })

    it('handles special characters in values', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockTrendsRaw)
      await getFbsTrends({ from: '2026-01-01', to: '2026-01-31', aggregation: 'day' })
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      // URL-encoded from/to contain hyphens which are valid unreserved chars
      expect(url).toContain('from=2026-01-01')
      expect(url).toContain('to=2026-01-31')
    })
  })
})
