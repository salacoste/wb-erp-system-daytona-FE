/**
 * Unit tests for Buyout Analytics API Client
 * Story 69.7: Tests for buyout analytics API layer
 * Epic 69: Buyout Rate per-SKU analytics (Frontend)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getBuyoutBySku,
  getBuyoutSummary,
  buyoutQueryKeys,
  BUYOUT_CACHE,
} from '../buyout-analytics'
import { apiClient } from '../../api-client'

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

vi.spyOn(console, 'info').mockImplementation(() => {})

describe('Buyout Analytics API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getBuyoutBySku', () => {
    const mockResponse = {
      data: [
        {
          nmId: 12345,
          supplierArticle: 'ART-001',
          productName: 'Test Product',
          brand: 'TestBrand',
          salesCount: 100,
          returnsCount: 5,
          buyoutRatePct: 95.0,
          trend: 'up' as const,
          trendDelta: 2.3,
          confidence: 'high' as const,
        },
      ],
      pagination: { total: 1, limit: 20, offset: 0, hasMore: false },
    }

    it('sends required from/to query params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getBuyoutBySku({ from: '2025-12-01', to: '2025-12-31' })

      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('/v1/analytics/buyout/by-sku?')
      expect(url).toContain('from=2025-12-01')
      expect(url).toContain('to=2025-12-31')
    })

    it('includes optional params when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getBuyoutBySku({
        from: '2025-12-01',
        to: '2025-12-31',
        source: 'weekly',
        sort: 'buyoutRate',
        sortOrder: 'desc',
        limit: 50,
        offset: 10,
      })

      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('source=weekly')
      expect(url).toContain('sort=buyoutRate')
      expect(url).toContain('sortOrder=desc')
      expect(url).toContain('limit=50')
      expect(url).toContain('offset=10')
    })

    it('includes trend and nmId params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getBuyoutBySku({
        from: '2025-12-01',
        to: '2025-12-31',
        trend: true,
        nmId: 67890,
        minSales: 5,
      })

      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('trend=true')
      expect(url).toContain('nmId=67890')
      expect(url).toContain('minSales=5')
    })

    it('omits undefined optional params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getBuyoutBySku({ from: '2025-12-01', to: '2025-12-31' })

      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).not.toContain('source=')
      expect(url).not.toContain('sort=')
      expect(url).not.toContain('sortOrder=')
      expect(url).not.toContain('limit=')
      expect(url).not.toContain('offset=')
      expect(url).not.toContain('trend=')
      expect(url).not.toContain('nmId=')
      expect(url).not.toContain('minSales=')
    })

    it('passes skipDataUnwrap: true', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getBuyoutBySku({ from: '2025-12-01', to: '2025-12-31' })

      const options = vi.mocked(apiClient.get).mock.calls[0][1]
      expect(options).toEqual(expect.objectContaining({ skipDataUnwrap: true }))
    })

    it('returns response data', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getBuyoutBySku({
        from: '2025-12-01',
        to: '2025-12-31',
      })

      expect(result).toEqual(mockResponse)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].nmId).toBe(12345)
    })
  })

  describe('getBuyoutSummary', () => {
    const mockResponse = {
      overallBuyoutRatePct: 87.5,
      overallReturnRatePct: 12.5,
      totalSalesCount: 500,
      totalReturnsCount: 63,
      skuCount: 42,
      period: { from: '2025-12-01', to: '2025-12-31' },
      source: 'blended' as const,
      confidence: 'high' as const,
    }

    it('sends required from/to query params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getBuyoutSummary({ from: '2025-12-01', to: '2025-12-31' })

      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('/v1/analytics/buyout/summary?')
      expect(url).toContain('from=2025-12-01')
      expect(url).toContain('to=2025-12-31')
    })

    it('includes optional source param', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getBuyoutSummary({
        from: '2025-12-01',
        to: '2025-12-31',
        source: 'realtime',
      })

      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('source=realtime')
    })

    it('omits source when not provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getBuyoutSummary({ from: '2025-12-01', to: '2025-12-31' })

      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).not.toContain('source=')
    })

    it('passes skipDataUnwrap: true', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getBuyoutSummary({ from: '2025-12-01', to: '2025-12-31' })

      const options = vi.mocked(apiClient.get).mock.calls[0][1]
      expect(options).toEqual(expect.objectContaining({ skipDataUnwrap: true }))
    })

    it('returns summary response', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getBuyoutSummary({
        from: '2025-12-01',
        to: '2025-12-31',
      })

      expect(result.overallBuyoutRatePct).toBe(87.5)
      expect(result.skuCount).toBe(42)
      expect(result.source).toBe('blended')
    })
  })

  describe('buyoutQueryKeys', () => {
    it('all returns base key', () => {
      expect(buyoutQueryKeys.all).toEqual(['buyout-analytics'])
    })

    it('bySku returns unique keys for different params', () => {
      const params1 = { from: '2025-12-01', to: '2025-12-31' }
      const params2 = { from: '2025-11-01', to: '2025-11-30' }

      const key1 = buyoutQueryKeys.bySku(params1)
      const key2 = buyoutQueryKeys.bySku(params2)

      expect(key1).toEqual(['buyout-analytics', 'by-sku', params1])
      expect(key2).toEqual(['buyout-analytics', 'by-sku', params2])
      expect(key1).not.toEqual(key2)
    })

    it('summary returns unique keys for different params', () => {
      const params1 = { from: '2025-12-01', to: '2025-12-31' }
      const params2 = { from: '2025-12-01', to: '2025-12-31', source: 'weekly' as const }

      const key1 = buyoutQueryKeys.summary(params1)
      const key2 = buyoutQueryKeys.summary(params2)

      expect(key1).toEqual(['buyout-analytics', 'summary', params1])
      expect(key2).toEqual(['buyout-analytics', 'summary', params2])
      expect(key1).not.toEqual(key2)
    })

    it('bySku and summary produce different keys for same date range', () => {
      const params = { from: '2025-12-01', to: '2025-12-31' }
      const bySkuKey = buyoutQueryKeys.bySku(params)
      const summaryKey = buyoutQueryKeys.summary(params)

      expect(bySkuKey[1]).toBe('by-sku')
      expect(summaryKey[1]).toBe('summary')
      expect(bySkuKey).not.toEqual(summaryKey)
    })
  })

  describe('BUYOUT_CACHE', () => {
    it('has staleTime of 25 minutes', () => {
      expect(BUYOUT_CACHE.staleTime).toBe(25 * 60 * 1000)
    })

    it('has gcTime of 60 minutes', () => {
      expect(BUYOUT_CACHE.gcTime).toBe(60 * 60 * 1000)
    })
  })
})
