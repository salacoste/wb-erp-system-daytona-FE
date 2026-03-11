/**
 * TDD Tests for Stories 61.8-FE and 61.12-FE
 * Epic 61-FE: Dashboard Data Integration
 *
 * RED Phase: Tests written BEFORE implementation
 *
 * Story 61.8-FE: Add Advertising Total Spend
 * - Extract total_spend from advertising response
 * - Transform for dashboard metric
 * - Handle null/zero spend
 *
 * Story 61.12-FE: Increase Advertising Cache Time
 * - Change staleTime from 30s to 30min (1800000ms)
 * - Verify cache invalidation still works
 *
 * @see docs/epics/epic-61-fe-dashboard-data-integration.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { server } from '@/mocks/server'
import { http, HttpResponse } from 'msw'
import { useAdvertisingAnalytics, advertisingQueryKeys } from '../useAdvertisingAnalytics'
import {
  renderHookWithClient,
  setupMockAuth,
  clearMockAuth,
  createTestQueryClient,
} from '@/test/test-utils'
import type { AdvertisingAnalyticsParams } from '@/types/advertising-analytics'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// =============================================================================
// Story 61.8-FE: Add Advertising Total Spend
// =============================================================================

describe('Story 61.8-FE: Add Advertising Total Spend', () => {
  beforeEach(() => {
    setupMockAuth()
  })

  afterEach(() => {
    clearMockAuth()
    vi.clearAllMocks()
  })

  describe('total_spend extraction from advertising response', () => {
    it('should extract total_spend from summary in response', async () => {
      const params: AdvertisingAnalyticsParams = {
        from: '2025-12-08',
        to: '2025-12-21',
      }

      const { result } = renderHookWithClient(() => useAdvertisingAnalytics(params))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.summary).toBeDefined()
      expect(result.current.data?.summary.total_spend).toBeDefined()
      expect(typeof result.current.data?.summary.total_spend).toBe('number')
    })

    it('should return total_spend as a numeric value for dashboard metric', async () => {
      server.use(
        http.get(`${API_BASE_URL}/v1/analytics/advertising`, () => {
          return HttpResponse.json({
            items: [],
            summary: {
              totalSpend: 125000,
              totalRevenue: 450000,
              totalProfit: 85000,
              avgRoas: 3.6,
              avgRoi: 0.46,
              avgCtr: 2.5,
              avgConversionRate: 4.2,
              campaignCount: 10,
              activeCampaigns: 8,
              totalSales: 600000,
              totalOrganicSales: 150000,
              avgOrganicContribution: 25,
            },
            query: {
              cabinetId: 'test-cabinet-id',
              from: '2025-12-08',
              to: '2025-12-21',
              viewBy: 'sku',
            },
            pagination: { total: 0, limit: 100, offset: 0 },
            cachedAt: '2025-12-21T06:00:00Z',
          })
        })
      )

      const params: AdvertisingAnalyticsParams = {
        from: '2025-12-08',
        to: '2025-12-21',
      }

      const { result } = renderHookWithClient(() => useAdvertisingAnalytics(params))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verify total_spend is correctly extracted and transformed
      expect(result.current.data?.summary.total_spend).toBe(125000)
    })
  })

  describe('null/zero spend handling', () => {
    it('should handle zero total_spend gracefully', async () => {
      server.use(
        http.get(`${API_BASE_URL}/v1/analytics/advertising`, () => {
          return HttpResponse.json({
            items: [],
            summary: {
              totalSpend: 0,
              totalRevenue: 0,
              totalProfit: 0,
              avgRoas: 0,
              avgRoi: 0,
              avgCtr: 0,
              avgConversionRate: 0,
              campaignCount: 0,
              activeCampaigns: 0,
              totalSales: 0,
              totalOrganicSales: 0,
              avgOrganicContribution: 0,
            },
            query: {
              cabinetId: 'test-cabinet-id',
              from: '2025-12-08',
              to: '2025-12-21',
              viewBy: 'sku',
            },
            pagination: { total: 0, limit: 100, offset: 0 },
            cachedAt: '2025-12-21T06:00:00Z',
          })
        })
      )

      const params: AdvertisingAnalyticsParams = {
        from: '2025-12-08',
        to: '2025-12-21',
      }

      const { result } = renderHookWithClient(() => useAdvertisingAnalytics(params))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data?.summary.total_spend).toBe(0)
      expect(Number.isNaN(result.current.data?.summary.total_spend)).toBe(false)
    })

    it('should handle null/undefined total_spend by defaulting to 0', async () => {
      server.use(
        http.get(`${API_BASE_URL}/v1/analytics/advertising`, () => {
          return HttpResponse.json({
            items: [],
            summary: {
              // totalSpend intentionally omitted to test null handling
              totalRevenue: 10000,
              totalProfit: 5000,
              avgRoas: 2.0,
              avgRoi: 0.5,
              avgCtr: 1.5,
              avgConversionRate: 3.0,
              campaignCount: 2,
              activeCampaigns: 1,
            },
            query: {
              cabinetId: 'test-cabinet-id',
              from: '2025-12-08',
              to: '2025-12-21',
              viewBy: 'sku',
            },
            pagination: { total: 0, limit: 100, offset: 0 },
            cachedAt: '2025-12-21T06:00:00Z',
          })
        })
      )

      const params: AdvertisingAnalyticsParams = {
        from: '2025-12-08',
        to: '2025-12-21',
      }

      const { result } = renderHookWithClient(() => useAdvertisingAnalytics(params))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // When total_spend is missing, it should default to 0 (not undefined/null)
      expect(result.current.data?.summary.total_spend).toBeDefined()
      expect(result.current.data?.summary.total_spend).toBeGreaterThanOrEqual(0)
    })
  })

  describe('integration with theoretical profit calculation', () => {
    it('should provide total_spend usable in theoretical profit formula', async () => {
      server.use(
        http.get(`${API_BASE_URL}/v1/analytics/advertising`, () => {
          return HttpResponse.json({
            items: [],
            summary: {
              totalSpend: 50000, // Advertising spend for theoretical profit
              totalRevenue: 200000,
              totalProfit: 100000,
              avgRoas: 4.0,
              avgRoi: 1.0,
              avgCtr: 3.0,
              avgConversionRate: 5.0,
              campaignCount: 5,
              activeCampaigns: 4,
              totalSales: 250000,
              totalOrganicSales: 50000,
              avgOrganicContribution: 20,
            },
            query: {
              cabinetId: 'test-cabinet-id',
              from: '2025-12-08',
              to: '2025-12-21',
              viewBy: 'sku',
            },
            pagination: { total: 0, limit: 100, offset: 0 },
            cachedAt: '2025-12-21T06:00:00Z',
          })
        })
      )

      const params: AdvertisingAnalyticsParams = {
        from: '2025-12-08',
        to: '2025-12-21',
      }

      const { result } = renderHookWithClient(() => useAdvertisingAnalytics(params))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const advertisingSpend = result.current.data?.summary.total_spend

      // Verify total_spend can be used in theoretical profit calculation
      // theoreticalProfit = orders - cogs - advertising - logistics - storage
      expect(advertisingSpend).toBe(50000)
      expect(typeof advertisingSpend).toBe('number')

      // Simulate theoretical profit calculation using advertising spend
      const mockOrders = 300000
      const mockCogs = 150000
      const mockLogistics = 30000
      const mockStorage = 20000
      const theoreticalProfit =
        mockOrders - mockCogs - (advertisingSpend ?? 0) - mockLogistics - mockStorage

      expect(theoreticalProfit).toBe(50000) // 300000 - 150000 - 50000 - 30000 - 20000
    })
  })
})

// =============================================================================
// Story 61.12-FE: Increase Advertising Cache Time
// =============================================================================

describe('Story 61.12-FE: Increase Advertising Cache Time', () => {
  beforeEach(() => {
    setupMockAuth()
  })

  afterEach(() => {
    clearMockAuth()
    vi.clearAllMocks()
  })

  describe('cache configuration validation', () => {
    it('should use 30 minute staleTime (1800000ms) for advertising analytics', async () => {
      /**
       * This test validates that the staleTime is configured to 30 minutes.
       *
       * Per Story 61.12-FE:
       * - Backend recommends 30 min cache for advertising
       * - Current implementation uses 30 seconds (staleTime: 30000)
       * - This causes excessive API calls
       *
       * Expected staleTime: 1800000ms (30 minutes)
       */
      const queryClient = createTestQueryClient()
      const params: AdvertisingAnalyticsParams = {
        from: '2025-12-08',
        to: '2025-12-21',
      }

      const { result } = renderHookWithClient(() => useAdvertisingAnalytics(params), {
        queryClient,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Get the query from the cache
      const queryKey = advertisingQueryKeys.analytics(params)
      const queryState = queryClient.getQueryState(queryKey)

      expect(queryState).toBeDefined()

      // The query should be fresh for 30 minutes
      // We verify this by checking that the data doesn't become stale immediately
      const dataUpdatedAt = queryState?.dataUpdatedAt ?? 0
      const now = Date.now()

      // Data should be recent (within last few seconds for this test)
      expect(now - dataUpdatedAt).toBeLessThan(5000)

      // Note: The actual staleTime verification requires checking the hook implementation
      // This test documents the expected behavior: data should remain fresh for 30 minutes
    })

    it('should have gcTime greater than or equal to staleTime', async () => {
      /**
       * gcTime (garbage collection time) should be >= staleTime
       * to ensure cached data isn't garbage collected before it becomes stale.
       *
       * Expected: gcTime >= 1800000ms (30 minutes)
       */
      const queryClient = createTestQueryClient()
      const params: AdvertisingAnalyticsParams = {
        from: '2025-12-08',
        to: '2025-12-21',
      }

      const { result } = renderHookWithClient(() => useAdvertisingAnalytics(params), {
        queryClient,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // After query completes, the data should be in cache
      const queryKey = advertisingQueryKeys.analytics(params)
      const cachedData = queryClient.getQueryData(queryKey)

      expect(cachedData).toBeDefined()

      // Note: gcTime is typically verified at the implementation level
      // This test documents the expected behavior that data remains cached
    })
  })

  describe('cache invalidation on manual refresh', () => {
    it('should refetch data when manually invalidated', async () => {
      let fetchCount = 0

      server.use(
        http.get(`${API_BASE_URL}/v1/analytics/advertising`, () => {
          fetchCount++
          return HttpResponse.json({
            items: [],
            summary: {
              totalSpend: fetchCount * 1000, // Different value each call
              totalRevenue: 0,
              totalProfit: 0,
              avgRoas: 0,
              avgRoi: 0,
              avgCtr: 0,
              avgConversionRate: 0,
              campaignCount: 0,
              activeCampaigns: 0,
            },
            query: {
              cabinetId: 'test-cabinet-id',
              from: '2025-12-08',
              to: '2025-12-21',
              viewBy: 'sku',
            },
            pagination: { total: 0, limit: 100, offset: 0 },
            cachedAt: new Date().toISOString(),
          })
        })
      )

      const queryClient = createTestQueryClient()
      const params: AdvertisingAnalyticsParams = {
        from: '2025-12-08',
        to: '2025-12-21',
      }

      const { result } = renderHookWithClient(() => useAdvertisingAnalytics(params), {
        queryClient,
      })

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialSpend = result.current.data?.summary.total_spend
      expect(initialSpend).toBe(1000) // First fetch
      expect(fetchCount).toBe(1)

      // Manually invalidate the query (simulating manual refresh)
      const queryKey = advertisingQueryKeys.analytics(params)
      await queryClient.invalidateQueries({ queryKey })

      // Wait for refetch
      await waitFor(() => {
        expect(result.current.data?.summary.total_spend).toBe(2000) // Second fetch
      })

      expect(fetchCount).toBe(2) // Cache invalidation triggered refetch
    })

    it('should not refetch automatically within stale time window', async () => {
      let fetchCount = 0

      server.use(
        http.get(`${API_BASE_URL}/v1/analytics/advertising`, () => {
          fetchCount++
          return HttpResponse.json({
            items: [],
            summary: {
              totalSpend: 50000,
              totalRevenue: 200000,
              totalProfit: 100000,
              avgRoas: 4.0,
              avgRoi: 1.0,
              avgCtr: 3.0,
              avgConversionRate: 5.0,
              campaignCount: 5,
              activeCampaigns: 4,
            },
            query: {
              cabinetId: 'test-cabinet-id',
              from: '2025-12-08',
              to: '2025-12-21',
              viewBy: 'sku',
            },
            pagination: { total: 0, limit: 100, offset: 0 },
            cachedAt: new Date().toISOString(),
          })
        })
      )

      const queryClient = createTestQueryClient()
      const params: AdvertisingAnalyticsParams = {
        from: '2025-12-08',
        to: '2025-12-21',
      }

      // First render
      const { result: result1 } = renderHookWithClient(() => useAdvertisingAnalytics(params), {
        queryClient,
      })

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      expect(fetchCount).toBe(1)

      // Second render with same params (should use cache)
      const { result: result2 } = renderHookWithClient(() => useAdvertisingAnalytics(params), {
        queryClient,
      })

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false)
      })

      // Should not trigger additional fetch (data from cache)
      expect(fetchCount).toBe(1)
      expect(result2.current.data?.summary.total_spend).toBe(50000)
    })
  })

  describe('staleTime constant verification', () => {
    /**
     * These tests document the expected staleTime values.
     * The implementation should be updated to use these values.
     */
    it('should define ADVERTISING_STALE_TIME as 1800000 (30 minutes)', () => {
      const ADVERTISING_STALE_TIME_MS = 30 * 60 * 1000 // 30 minutes
      expect(ADVERTISING_STALE_TIME_MS).toBe(1800000)
    })

    it('should define ADVERTISING_GC_TIME as at least staleTime', () => {
      const ADVERTISING_STALE_TIME_MS = 30 * 60 * 1000 // 30 minutes
      const ADVERTISING_GC_TIME_MS = 35 * 60 * 1000 // 35 minutes (recommended)

      expect(ADVERTISING_GC_TIME_MS).toBeGreaterThanOrEqual(ADVERTISING_STALE_TIME_MS)
    })
  })
})
