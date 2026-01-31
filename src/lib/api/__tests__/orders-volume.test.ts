/**
 * Tests for Orders Volume API Client
 * Story 61.3-FE: Orders Volume API Integration
 * Epic 61-FE: Dashboard Data Integration
 *
 * Tests: getOrdersVolume, transformToMetrics, ordersVolumeQueryKeys
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock API client
vi.mock('../../api-client', () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from '../../api-client'
import { getOrdersVolume, transformToMetrics, ordersVolumeQueryKeys } from '../orders-volume'
import type { OrdersVolumeResponse } from '@/types/orders-volume'

// =============================================================================
// Mock Response Fixtures
// =============================================================================

const mockOrdersVolumeResponse: OrdersVolumeResponse = {
  total_orders: 1250,
  total_amount: 4500000, // 4.5M RUB
  avg_order_value: 3600,
  by_status: {
    new: 50,
    confirm: 150,
    complete: 950,
    cancel: 100,
  },
}

const mockOrdersVolumeWithDailyResponse: OrdersVolumeResponse = {
  ...mockOrdersVolumeResponse,
  by_day: [
    { date: '2026-01-27', orders: 180, amount: 650000 },
    { date: '2026-01-28', orders: 175, amount: 630000 },
    { date: '2026-01-29', orders: 190, amount: 680000 },
    { date: '2026-01-30', orders: 185, amount: 665000 },
    { date: '2026-01-31', orders: 200, amount: 720000 },
    { date: '2026-02-01', orders: 170, amount: 610000 },
    { date: '2026-02-02', orders: 150, amount: 545000 },
  ],
}

const mockOrdersVolumeWithHourlyResponse: OrdersVolumeResponse = {
  ...mockOrdersVolumeResponse,
  by_hour: [
    { hour: 9, orders: 45, amount: 162000 },
    { hour: 10, orders: 78, amount: 280800 },
    { hour: 11, orders: 92, amount: 331200 },
    { hour: 12, orders: 65, amount: 234000 },
    { hour: 13, orders: 54, amount: 194400 },
  ],
}

const mockEmptyResponse: OrdersVolumeResponse = {
  total_orders: 0,
  total_amount: 0,
  avg_order_value: 0,
  by_status: {
    new: 0,
    confirm: 0,
    complete: 0,
    cancel: 0,
  },
}

// =============================================================================
// getOrdersVolume Tests
// =============================================================================

describe('Orders Volume API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOrdersVolume', () => {
    it('calls API with correct endpoint /v1/analytics/orders/volume', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockOrdersVolumeResponse)
      await getOrdersVolume({ from: '2026-01-27', to: '2026-02-02' })
      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('/v1/analytics/orders/volume')
    })

    it('includes from and to date params in query string', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockOrdersVolumeResponse)
      await getOrdersVolume({ from: '2026-01-27', to: '2026-02-02' })
      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('from=2026-01-27')
      expect(url).toContain('to=2026-02-02')
    })

    it('includes aggregation=day param when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockOrdersVolumeWithDailyResponse)
      await getOrdersVolume({
        from: '2026-01-27',
        to: '2026-02-02',
        aggregation: 'day',
      })
      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('aggregation=day')
    })

    it('includes aggregation=hour param when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockOrdersVolumeWithHourlyResponse)
      await getOrdersVolume({
        from: '2026-01-27',
        to: '2026-02-02',
        aggregation: 'hour',
      })
      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('aggregation=hour')
    })

    it('omits aggregation param when not provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockOrdersVolumeResponse)
      await getOrdersVolume({ from: '2026-01-27', to: '2026-02-02' })
      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).not.toContain('aggregation')
    })

    it('returns OrdersVolumeResponse with totals', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockOrdersVolumeResponse)
      const result = await getOrdersVolume({ from: '2026-01-27', to: '2026-02-02' })
      expect(result.total_orders).toBe(1250)
      expect(result.total_amount).toBe(4500000)
      expect(result.avg_order_value).toBe(3600)
    })

    it('returns OrdersVolumeResponse with status breakdown', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockOrdersVolumeResponse)
      const result = await getOrdersVolume({ from: '2026-01-27', to: '2026-02-02' })
      expect(result.by_status.new).toBe(50)
      expect(result.by_status.confirm).toBe(150)
      expect(result.by_status.complete).toBe(950)
      expect(result.by_status.cancel).toBe(100)
    })

    it('returns by_day array when aggregation=day', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockOrdersVolumeWithDailyResponse)
      const result = await getOrdersVolume({
        from: '2026-01-27',
        to: '2026-02-02',
        aggregation: 'day',
      })
      expect(result.by_day).toBeDefined()
      expect(result.by_day).toHaveLength(7)
      expect(result.by_day![0].date).toBe('2026-01-27')
      expect(result.by_day![0].orders).toBe(180)
      expect(result.by_day![0].amount).toBe(650000)
    })

    it('returns by_hour array when aggregation=hour', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockOrdersVolumeWithHourlyResponse)
      const result = await getOrdersVolume({
        from: '2026-01-27',
        to: '2026-02-02',
        aggregation: 'hour',
      })
      expect(result.by_hour).toBeDefined()
      expect(result.by_hour).toHaveLength(5)
      expect(result.by_hour![0].hour).toBe(9)
    })

    it('handles empty response gracefully', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockEmptyResponse)
      const result = await getOrdersVolume({ from: '2026-01-27', to: '2026-02-02' })
      expect(result.total_orders).toBe(0)
      expect(result.total_amount).toBe(0)
    })
  })

  // ===========================================================================
  // transformToMetrics Tests
  // ===========================================================================

  describe('transformToMetrics', () => {
    it('transforms API response to OrdersVolumeMetrics', () => {
      const metrics = transformToMetrics(mockOrdersVolumeResponse)
      expect(metrics.totalOrders).toBe(1250)
      expect(metrics.totalAmount).toBe(4500000)
      expect(metrics.avgOrderValue).toBe(3600)
    })

    it('calculates completionRate correctly', () => {
      const metrics = transformToMetrics(mockOrdersVolumeResponse)
      // complete / total * 100 = 950 / 1250 * 100 = 76%
      expect(metrics.completionRate).toBeCloseTo(76, 0)
    })

    it('calculates cancellationRate correctly', () => {
      const metrics = transformToMetrics(mockOrdersVolumeResponse)
      // cancel / total * 100 = 100 / 1250 * 100 = 8%
      expect(metrics.cancellationRate).toBeCloseTo(8, 0)
    })

    it('handles zero total_orders without division error', () => {
      const metrics = transformToMetrics(mockEmptyResponse)
      expect(metrics.completionRate).toBe(0) // Not NaN
      expect(metrics.cancellationRate).toBe(0) // Not NaN
      expect(Number.isNaN(metrics.completionRate)).toBe(false)
    })

    it('includes dailyBreakdown when by_day is present', () => {
      const metrics = transformToMetrics(mockOrdersVolumeWithDailyResponse)
      expect(metrics.dailyBreakdown).toBeDefined()
      expect(metrics.dailyBreakdown).toHaveLength(7)
    })

    it('dailyBreakdown is undefined when by_day is not present', () => {
      const metrics = transformToMetrics(mockOrdersVolumeResponse)
      expect(metrics.dailyBreakdown).toBeUndefined()
    })
  })

  // ===========================================================================
  // Query Keys Factory Tests
  // ===========================================================================

  describe('ordersVolumeQueryKeys', () => {
    it('has all base key as ["orders-volume"]', () => {
      expect(ordersVolumeQueryKeys.all).toEqual(['orders-volume'])
    })

    it('byRange includes from and to in key', () => {
      const key = ordersVolumeQueryKeys.byRange('2026-01-27', '2026-02-02')
      expect(key).toEqual(['orders-volume', '2026-01-27', '2026-02-02'])
    })

    it('byRangeWithAggregation includes aggregation in key', () => {
      const key = ordersVolumeQueryKeys.byRangeWithAggregation('2026-01-27', '2026-02-02', 'day')
      expect(key).toEqual(['orders-volume', '2026-01-27', '2026-02-02', 'day'])
    })

    it('different aggregations produce different keys', () => {
      const keyDay = ordersVolumeQueryKeys.byRangeWithAggregation('2026-01-27', '2026-02-02', 'day')
      const keyHour = ordersVolumeQueryKeys.byRangeWithAggregation(
        '2026-01-27',
        '2026-02-02',
        'hour'
      )
      const keyTotal = ordersVolumeQueryKeys.byRangeWithAggregation(
        '2026-01-27',
        '2026-02-02',
        'total'
      )
      expect(keyDay).not.toEqual(keyHour)
      expect(keyDay).not.toEqual(keyTotal)
    })
  })

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================

  describe('Error Handling', () => {
    it('throws on 400 INVALID_DATE_FORMAT', async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        response: { status: 400, data: { code: 'INVALID_DATE_FORMAT' } },
      })
      await expect(getOrdersVolume({ from: 'invalid', to: '2026-02-02' })).rejects.toThrow()
    })

    it('throws on 400 INVALID_DATE_RANGE', async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        response: { status: 400, data: { code: 'INVALID_DATE_RANGE' } },
      })
      await expect(
        getOrdersVolume({ from: '2026-02-02', to: '2026-01-27' }) // from > to
      ).rejects.toThrow()
    })

    it('throws on 404 NO_DATA_FOUND', async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        response: { status: 404, data: { code: 'NO_DATA_FOUND' } },
      })
      await expect(getOrdersVolume({ from: '2020-01-01', to: '2020-01-07' })).rejects.toThrow()
    })

    it('throws on 401 UNAUTHORIZED', async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        response: { status: 401, data: { code: 'UNAUTHORIZED' } },
      })
      await expect(getOrdersVolume({ from: '2026-01-27', to: '2026-02-02' })).rejects.toThrow()
    })
  })
})
