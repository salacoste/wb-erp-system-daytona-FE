/**
 * Unit tests for Search Analytics API Client
 * Story 71.2-FE: Search Analytics API Client & Hooks
 * Epic 71-FE: Search Analytics & Jam Gating
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getSearchByProduct,
  getSearchByQuery,
  getSearchOrders,
  searchQueryKeys,
  SEARCH_CACHE,
} from '../search-analytics'
import { apiClient } from '../../api-client'

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

vi.spyOn(console, 'info').mockImplementation(() => {})

describe('Search Analytics API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSearchByProduct', () => {
    const mockResponse = {
      nmId: 12345,
      period: { from: '2026-02-01', to: '2026-02-28' },
      queries: [
        {
          searchQuery: 'test query',
          avgPosition: 5.2,
          totalImpressions: 1000,
          totalClicks: 50,
          avgCtr: 5.0,
          totalOrders: 10,
          // Story 119.1-FE: removed legacy totalRevenue field (Story 91.1-FE) — normalizer drops it
        },
      ],
      totalQueries: 1,
    }

    it('sends required nmId, from, to params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getSearchByProduct({ nmId: 12345, from: '2026-02-01', to: '2026-02-28' })

      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('/v1/analytics/search/by-product?')
      expect(url).toContain('nmId=12345')
      expect(url).toContain('from=2026-02-01')
      expect(url).toContain('to=2026-02-28')
    })

    it('includes optional orderBy and limit params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getSearchByProduct({
        nmId: 12345,
        from: '2026-02-01',
        to: '2026-02-28',
        orderBy: 'totalClicks',
        limit: 25,
      })

      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('orderBy=totalClicks')
      expect(url).toContain('limit=25')
    })

    it('omits undefined optional params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getSearchByProduct({ nmId: 12345, from: '2026-02-01', to: '2026-02-28' })

      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).not.toContain('orderBy=')
      expect(url).not.toContain('limit=')
    })

    it('passes skipDataUnwrap: true', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getSearchByProduct({ nmId: 12345, from: '2026-02-01', to: '2026-02-28' })

      const options = vi.mocked(apiClient.get).mock.calls[0][1]
      expect(options).toEqual(expect.objectContaining({ skipDataUnwrap: true }))
    })

    it('returns response data', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getSearchByProduct({
        nmId: 12345,
        from: '2026-02-01',
        to: '2026-02-28',
      })

      expect(result).toEqual(mockResponse)
      expect(result.queries).toHaveLength(1)
      expect(result.nmId).toBe(12345)
    })
  })

  describe('getSearchByQuery', () => {
    const mockResponse = {
      query: 'кроссовки',
      period: { from: '2026-02-01', to: '2026-02-28' },
      products: [
        {
          nmId: 67890,
          vendorCode: 'ART-001',
          avgPosition: 3.1,
          totalImpressions: 2000,
          totalClicks: 150,
          avgCtr: 7.5,
          totalOrders: 30,
          // Story 119.1-FE: removed legacy totalRevenue field (Story 91.1-FE) — normalizer drops it
        },
      ],
      totalProducts: 1,
    }

    it('sends required query, from, to params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getSearchByQuery({ query: 'кроссовки', from: '2026-02-01', to: '2026-02-28' })

      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('/v1/analytics/search/by-query?')
      expect(url).toContain('from=2026-02-01')
      expect(url).toContain('to=2026-02-28')
      // URLSearchParams encodes Cyrillic — parse to verify decoded value
      const sp = new URLSearchParams(url.split('?')[1])
      expect(sp.get('query')).toBe('кроссовки')
    })

    it('includes optional limit param', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getSearchByQuery({
        query: 'кроссовки',
        from: '2026-02-01',
        to: '2026-02-28',
        limit: 10,
      })

      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('limit=10')
    })

    it('omits limit when not provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getSearchByQuery({ query: 'кроссовки', from: '2026-02-01', to: '2026-02-28' })

      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).not.toContain('limit=')
    })

    it('passes skipDataUnwrap: true', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getSearchByQuery({ query: 'кроссовки', from: '2026-02-01', to: '2026-02-28' })

      const options = vi.mocked(apiClient.get).mock.calls[0][1]
      expect(options).toEqual(expect.objectContaining({ skipDataUnwrap: true }))
    })

    it('returns response data', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getSearchByQuery({
        query: 'кроссовки',
        from: '2026-02-01',
        to: '2026-02-28',
      })

      expect(result.query).toBe('кроссовки')
      expect(result.products).toHaveLength(1)
      expect(result.products[0].nmId).toBe(67890)
    })
  })

  describe('getSearchOrders', () => {
    const mockResponse = {
      period: { from: '2026-02-01', to: '2026-02-28' },
      groupBy: 'query' as const,
      items: [
        {
          key: 'кроссовки мужские',
          totalOrders: 50,
          // Story 119.1-FE: removed legacy totalRevenue field (Story 91.1-FE) — normalizer drops it
          uniqueProducts: 12,
        },
      ],
      summary: {
        totalSearchOrders: 500,
        // Story 119.1-FE: removed legacy totalSearchRevenue field (Story 91.1-FE) — normalizer drops it
        searchOrderShare: 35.2,
      },
    }

    it('sends required from, to params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getSearchOrders({ from: '2026-02-01', to: '2026-02-28' })

      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('/v1/analytics/search/orders?')
      expect(url).toContain('from=2026-02-01')
      expect(url).toContain('to=2026-02-28')
    })

    it('includes optional groupBy and limit params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getSearchOrders({
        from: '2026-02-01',
        to: '2026-02-28',
        groupBy: 'product',
        limit: 100,
      })

      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).toContain('groupBy=product')
      expect(url).toContain('limit=100')
    })

    it('omits undefined optional params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getSearchOrders({ from: '2026-02-01', to: '2026-02-28' })

      const url = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(url).not.toContain('groupBy=')
      expect(url).not.toContain('limit=')
    })

    it('passes skipDataUnwrap: true', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      await getSearchOrders({ from: '2026-02-01', to: '2026-02-28' })

      const options = vi.mocked(apiClient.get).mock.calls[0][1]
      expect(options).toEqual(expect.objectContaining({ skipDataUnwrap: true }))
    })

    it('returns response with summary', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await getSearchOrders({ from: '2026-02-01', to: '2026-02-28' })

      expect(result.items).toHaveLength(1)
      expect(result.summary.totalSearchOrders).toBe(500)
      expect(result.summary.searchOrderShare).toBe(35.2)
    })
  })

  describe('searchQueryKeys', () => {
    it('all returns base key', () => {
      expect(searchQueryKeys.all).toEqual(['search-analytics'])
    })

    it('byProduct returns unique keys for different params', () => {
      const params1 = { nmId: 111, from: '2026-02-01', to: '2026-02-28' }
      const params2 = { nmId: 222, from: '2026-02-01', to: '2026-02-28' }

      const key1 = searchQueryKeys.byProduct(params1)
      const key2 = searchQueryKeys.byProduct(params2)

      expect(key1).toEqual(['search-analytics', 'by-product', params1])
      expect(key2).toEqual(['search-analytics', 'by-product', params2])
      expect(key1).not.toEqual(key2)
    })

    it('byQuery returns unique keys for different queries', () => {
      const params1 = { query: 'кроссовки', from: '2026-02-01', to: '2026-02-28' }
      const params2 = { query: 'ботинки', from: '2026-02-01', to: '2026-02-28' }

      const key1 = searchQueryKeys.byQuery(params1)
      const key2 = searchQueryKeys.byQuery(params2)

      expect(key1).toEqual(['search-analytics', 'by-query', params1])
      expect(key2).toEqual(['search-analytics', 'by-query', params2])
      expect(key1).not.toEqual(key2)
    })

    it('orders returns unique keys for different params', () => {
      const params1 = { from: '2026-02-01', to: '2026-02-28' }
      const params2 = { from: '2026-02-01', to: '2026-02-28', groupBy: 'product' as const }

      const key1 = searchQueryKeys.orders(params1)
      const key2 = searchQueryKeys.orders(params2)

      expect(key1).toEqual(['search-analytics', 'orders', params1])
      expect(key2).toEqual(['search-analytics', 'orders', params2])
      expect(key1).not.toEqual(key2)
    })

    it('different branches produce different keys', () => {
      const dateParams = { from: '2026-02-01', to: '2026-02-28' }
      const byProductKey = searchQueryKeys.byProduct({ nmId: 111, ...dateParams })
      const byQueryKey = searchQueryKeys.byQuery({ query: 'test', ...dateParams })
      const ordersKey = searchQueryKeys.orders(dateParams)

      expect(byProductKey[1]).toBe('by-product')
      expect(byQueryKey[1]).toBe('by-query')
      expect(ordersKey[1]).toBe('orders')
    })
  })

  describe('SEARCH_CACHE', () => {
    it('has staleTime of 4 minutes', () => {
      expect(SEARCH_CACHE.staleTime).toBe(4 * 60 * 1000)
    })

    it('has gcTime of 30 minutes', () => {
      expect(SEARCH_CACHE.gcTime).toBe(30 * 60 * 1000)
    })
  })
})
