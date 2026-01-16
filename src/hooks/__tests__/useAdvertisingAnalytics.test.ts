/**
 * Unit Tests for useAdvertisingAnalytics Hook
 * Epic 33 - Advertising Analytics
 * Story 33.8-FE: Integration Testing
 *
 * Tests:
 * - Successful data fetching
 * - Loading states
 * - Error handling
 * - Query parameter handling
 * - Campaigns hook
 * - Sync status hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { server } from '@/mocks/server'
import { http, HttpResponse } from 'msw'
import {
  useAdvertisingAnalytics,
  useAdvertisingCampaigns,
  useAdvertisingSyncStatus,
  advertisingQueryKeys,
} from '../useAdvertisingAnalytics'
import {
  renderHookWithClient,
  setupMockAuth,
  clearMockAuth,
} from '@/test/test-utils'
import type { AdvertisingAnalyticsParams } from '@/types/advertising-analytics'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

describe('useAdvertisingAnalytics', () => {
  beforeEach(() => {
    setupMockAuth()
  })

  afterEach(() => {
    clearMockAuth()
    vi.clearAllMocks()
  })

  describe('successful data fetching', () => {
    it('should fetch analytics data with required date parameters', async () => {
      const params: AdvertisingAnalyticsParams = {
        from: '2025-12-08',
        to: '2025-12-21',
      }

      const { result } = renderHookWithClient(() => useAdvertisingAnalytics(params))

      // Initially loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()

      // Wait for data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verify data structure
      expect(result.current.data).toBeDefined()
      expect(result.current.data?.meta.cabinet_id).toBe('test-cabinet-id')
      expect(result.current.data?.summary).toBeDefined()
      expect(result.current.data?.summary.total_spend).toBeGreaterThanOrEqual(0)
      expect(result.current.data?.data).toBeInstanceOf(Array)
      expect(result.current.error).toBeNull()
    })

    it('should fetch data with all optional parameters', async () => {
      const params: AdvertisingAnalyticsParams = {
        from: '2025-12-08',
        to: '2025-12-21',
        view_by: 'sku',
        efficiency_filter: 'excellent',
        sort_by: 'spend',
        sort_order: 'desc',
        limit: 25,
        offset: 0,
      }

      const { result } = renderHookWithClient(() => useAdvertisingAnalytics(params))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.error).toBeNull()
    })

    it('should filter data by efficiency status', async () => {
      const params: AdvertisingAnalyticsParams = {
        from: '2025-12-08',
        to: '2025-12-21',
        efficiency_filter: 'excellent',
      }

      const { result } = renderHookWithClient(() => useAdvertisingAnalytics(params))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // All items should have excellent status
      if (result.current.data?.data && result.current.data.data.length > 0) {
        result.current.data.data.forEach((item) => {
          expect(item.efficiency_status).toBe('excellent')
        })
      }
    })
  })

  describe('loading states', () => {
    it('should show loading state initially', () => {
      const params: AdvertisingAnalyticsParams = {
        from: '2025-12-08',
        to: '2025-12-21',
      }

      const { result } = renderHookWithClient(() => useAdvertisingAnalytics(params))

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isFetching).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should be disabled when from or to is missing', () => {
      const params = { from: '', to: '' } as AdvertisingAnalyticsParams

      const { result } = renderHookWithClient(() => useAdvertisingAnalytics(params))

      // Query should not be enabled
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isFetching).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      // Override handler with error response
      server.use(
        http.get(`${API_BASE_URL}/v1/analytics/advertising`, () => {
          return HttpResponse.json(
            { error: { code: 'INTERNAL', message: 'Server error' } },
            { status: 500 }
          )
        })
      )

      const params: AdvertisingAnalyticsParams = {
        from: '2025-12-08',
        to: '2025-12-21',
      }

      const { result } = renderHookWithClient(() => useAdvertisingAnalytics(params))

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true)
        },
        { timeout: 5000 }
      )

      expect(result.current.error).toBeDefined()
    })
  })

  describe('query keys', () => {
    it('should generate correct query key for analytics', () => {
      const params: AdvertisingAnalyticsParams = {
        from: '2025-12-08',
        to: '2025-12-21',
        view_by: 'sku',
      }

      const key = advertisingQueryKeys.analytics(params)

      expect(key).toContain('advertising')
      expect(key).toContain('analytics')
      expect(key).toContainEqual(params)
    })

    it('should generate correct query key for campaigns', () => {
      const key = advertisingQueryKeys.campaigns()

      expect(key).toContain('advertising')
      expect(key).toContain('campaigns')
    })

    it('should generate correct query key for sync status', () => {
      const key = advertisingQueryKeys.syncStatus()

      expect(key).toContain('advertising')
      expect(key).toContain('sync-status')
    })
  })
})

describe('useAdvertisingCampaigns', () => {
  beforeEach(() => {
    setupMockAuth()
  })

  afterEach(() => {
    clearMockAuth()
    vi.clearAllMocks()
  })

  it('should fetch campaigns list successfully', async () => {
    const { result } = renderHookWithClient(() => useAdvertisingCampaigns())

    // Initially loading
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.meta.total_count).toBeGreaterThan(0)
    expect(result.current.data?.data).toBeInstanceOf(Array)
  })

  it('should handle campaigns with different statuses', async () => {
    const { result } = renderHookWithClient(() => useAdvertisingCampaigns())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Should have campaigns with various statuses
    const campaigns = result.current.data?.data || []
    expect(campaigns.length).toBeGreaterThan(0)

    // Each campaign should have required fields
    campaigns.forEach((campaign) => {
      expect(campaign.campaign_id).toBeDefined()
      expect(campaign.name).toBeDefined()
      expect(campaign.status).toBeDefined()
      expect(campaign.type).toBeDefined()
    })
  })
})

describe('useAdvertisingSyncStatus', () => {
  beforeEach(() => {
    setupMockAuth()
  })

  afterEach(() => {
    clearMockAuth()
    vi.clearAllMocks()
  })

  it('should fetch sync status successfully', async () => {
    const { result } = renderHookWithClient(() => useAdvertisingSyncStatus())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()
    // Backend returns camelCase fields (Request #72)
    expect(result.current.data?.lastSyncAt).toBeDefined()
    expect(result.current.data?.status).toBeDefined()
    expect(result.current.data?.campaignsSynced).toBeGreaterThanOrEqual(0)
  })

  it('should have correct sync status values', async () => {
    const { result } = renderHookWithClient(() => useAdvertisingSyncStatus())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Backend returns status as SyncTaskStatus ('syncing' | 'completed' | 'failed' | 'idle')
    const status = result.current.data?.status
    expect(['syncing', 'completed', 'failed', 'idle']).toContain(status)
  })

  it('should use custom refetch interval when provided', () => {
    const { result } = renderHookWithClient(() =>
      useAdvertisingSyncStatus({
        refetchInterval: 30000, // 30 seconds
      })
    )

    // Hook should initialize without errors
    expect(result.current).toBeDefined()
  })
})

// ============================================================
// Epic 35: Organic Sales Edge Case Tests (Story 35.6 - DOC-001)
// Reference: docs/stories/epic-35/35.6.deployment-monitoring.md
// ============================================================

describe('Epic 35: Organic Sales Calculation Edge Cases', () => {
  beforeEach(() => {
    setupMockAuth()
  })

  afterEach(() => {
    clearMockAuth()
    vi.clearAllMocks()
  })

  it('should correctly calculate organic sales: organicSales = totalSales - revenue', async () => {
    // Test the explicit formula validation (QA Review DOC-001)
    server.use(
      http.get(`${API_BASE_URL}/v1/analytics/advertising`, () => {
        return HttpResponse.json({
          items: [
            {
              key: 'sku:100001',
              nmId: 100001,
              label: 'Test Product 1',
              spend: 5000,
              totalSales: 80000, // Epic 35: Backend camelCase
              revenue: 50000,
              organicSales: 30000, // Epic 35: Backend camelCase
              profit: 25000,
              profitAfterAds: 20000,
              views: 25000,
              clicks: 1250,
              orders: 250,
              roas: 10.0,
              roi: 4.0,
              ctr: 5.0,
              cpc: 4.0,
              conversionRate: 20.0,
              organicContribution: 37.5, // Epic 35: Backend camelCase
              efficiency: {
                status: 'excellent',
              },
            },
            {
              key: 'sku:100002',
              nmId: 100002,
              label: 'Test Product 2',
              spend: 5000,
              totalSales: 70000,
              revenue: 40000,
              organicSales: 30000,
              profit: 15000,
              profitAfterAds: 10000,
              views: 25000,
              clicks: 1250,
              orders: 250,
              roas: 8.0,
              roi: 2.0,
              ctr: 5.0,
              cpc: 4.0,
              conversionRate: 20.0,
              organicContribution: 42.86,
              efficiency: {
                status: 'good',
              },
            },
          ],
          summary: {
            totalSpend: 10000,
            totalSales: 150000, // Epic 35: Backend camelCase
            totalRevenue: 90000,
            totalOrganicSales: 60000, // Epic 35: Backend camelCase
            totalProfit: 40000,
            avgRoas: 9.0,
            avgRoi: 3.0,
            avgCtr: 5.0,
            avgConversionRate: 20.0,
            avgOrganicContribution: 40.0, // Epic 35: Backend camelCase
            campaignCount: 5,
            activeCampaigns: 4,
          },
          query: {
            cabinetId: 'test-cabinet-id',
            from: '2025-12-01',
            to: '2025-12-25',
            viewBy: 'sku',
          },
          pagination: {
            total: 2,
            limit: 50,
            offset: 0,
          },
          cachedAt: '2025-12-21T06:00:00Z',
        })
      })
    )

    const params: AdvertisingAnalyticsParams = {
      from: '2025-12-01',
      to: '2025-12-25',
    }

    const { result } = renderHookWithClient(() => useAdvertisingAnalytics(params))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()

    // Verify summary-level organic calculation
    const summary = result.current.data!.summary
    expect(summary.total_sales).toBe(150000)
    expect(summary.total_revenue).toBe(90000)
    expect(summary.total_organic_sales).toBe(60000)
    expect(summary.total_organic_sales).toBe(summary.total_sales - summary.total_revenue) // ✅ Formula validation

    // Verify item-level organic calculation
    const item1 = result.current.data!.data[0]
    expect(item1.total_sales).toBe(80000)
    expect(item1.revenue).toBe(50000)
    expect(item1.organic_sales).toBe(30000)
    expect(item1.organic_sales).toBe(item1.total_sales - item1.revenue) // ✅ Formula validation

    const item2 = result.current.data!.data[1]
    expect(item2.total_sales).toBe(70000)
    expect(item2.revenue).toBe(40000)
    expect(item2.organic_sales).toBe(30000)
    expect(item2.organic_sales).toBe(item2.total_sales - item2.revenue) // ✅ Formula validation
  })

  it('should handle negative organic sales when WB API over-attributes', async () => {
    // Edge case: revenue > totalSales → negative organicSales
    server.use(
      http.get(`${API_BASE_URL}/v1/analytics/advertising`, () => {
        return HttpResponse.json({
          items: [
            {
              key: 'sku:100001',
              nmId: 100001,
              label: 'Over-attributed Product',
              spend: 5000,
              totalSales: 20000, // Epic 35: Backend camelCase
              revenue: 28000, // More than totalSales!
              organicSales: -8000, // Negative organic sales
              profit: 8000,
              profitAfterAds: 3000,
              views: 15000,
              clicks: 500,
              orders: 100,
              roas: 5.6,
              roi: 0.6,
              ctr: 3.33,
              cpc: 10.0,
              conversionRate: 20.0,
              organicContribution: -40.0, // Negative %
              efficiency: {
                status: 'good',
              },
            },
          ],
          summary: {
            totalSpend: 5000,
            totalSales: 20000,
            totalRevenue: 28000, // Over-attributed by WB API!
            totalOrganicSales: -8000, // Negative organic
            totalProfit: 8000,
            avgRoas: 5.6,
            avgRoi: 0.6,
            avgCtr: 3.33,
            avgConversionRate: 20.0,
            avgOrganicContribution: -40.0, // Negative %
            campaignCount: 1,
            activeCampaigns: 1,
          },
          query: {
            cabinetId: 'test-cabinet-id',
            from: '2025-12-01',
            to: '2025-12-25',
            viewBy: 'sku',
          },
          pagination: {
            total: 1,
            limit: 50,
            offset: 0,
          },
          cachedAt: '2025-12-21T06:00:00Z',
        })
      })
    )

    const params: AdvertisingAnalyticsParams = {
      from: '2025-12-01',
      to: '2025-12-25',
    }

    const { result } = renderHookWithClient(() => useAdvertisingAnalytics(params))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()

    const item = result.current.data!.data[0]
    expect(item.total_sales).toBe(20000)
    expect(item.revenue).toBe(28000)
    expect(item.organic_sales).toBe(-8000) // Negative organic sales is valid
    expect(item.organic_sales).toBe(item.total_sales - item.revenue) // Formula still holds
    expect(item.organic_contribution).toBe(-40.0) // Negative % is valid

    // Verify summary also handles negative correctly
    expect(result.current.data!.summary.total_organic_sales).toBe(-8000)
    expect(result.current.data!.summary.avg_organic_contribution).toBe(-40.0)
  })

  it('should handle zero totalSales without division errors', async () => {
    // Edge case: totalSales = 0 → organicContribution should be 0 (not NaN)
    server.use(
      http.get(`${API_BASE_URL}/v1/analytics/advertising`, () => {
        return HttpResponse.json({
          items: [
            {
              key: 'sku:100001',
              nmId: 100001,
              label: 'No Sales Product',
              spend: 1500,
              totalSales: 0, // Zero total sales
              revenue: 0,
              organicSales: 0,
              profit: 0,
              profitAfterAds: -1500,
              views: 8000,
              clicks: 200,
              orders: 0,
              roas: 0,
              roi: -1.0,
              ctr: 2.5,
              cpc: 7.5,
              conversionRate: 0,
              organicContribution: 0, // NOT NaN!
              efficiency: {
                status: 'loss',
              },
            },
          ],
          summary: {
            totalSpend: 1500,
            totalSales: 0, // Zero total sales
            totalRevenue: 0,
            totalOrganicSales: 0,
            totalProfit: 0,
            avgRoas: 0,
            avgRoi: -1.0,
            avgCtr: 2.5,
            avgConversionRate: 0,
            avgOrganicContribution: 0, // NOT NaN!
            campaignCount: 1,
            activeCampaigns: 0,
          },
          query: {
            cabinetId: 'test-cabinet-id',
            from: '2025-12-01',
            to: '2025-12-25',
            viewBy: 'sku',
          },
          pagination: {
            total: 1,
            limit: 50,
            offset: 0,
          },
          cachedAt: '2025-12-21T06:00:00Z',
        })
      })
    )

    const params: AdvertisingAnalyticsParams = {
      from: '2025-12-01',
      to: '2025-12-25',
    }

    const { result } = renderHookWithClient(() => useAdvertisingAnalytics(params))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()

    const item = result.current.data!.data[0]
    expect(item.total_sales).toBe(0)
    expect(item.revenue).toBe(0)
    expect(item.organic_sales).toBe(0)
    expect(item.organic_contribution).toBe(0) // NOT NaN
    expect(Number.isNaN(item.organic_contribution)).toBe(false) // Explicit NaN check

    // Verify summary also handles zero correctly
    expect(result.current.data!.summary.total_sales).toBe(0)
    expect(result.current.data!.summary.avg_organic_contribution).toBe(0) // NOT NaN
    expect(Number.isNaN(result.current.data!.summary.avg_organic_contribution)).toBe(false)
  })
})
