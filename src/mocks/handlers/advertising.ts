/**
 * MSW Handlers for Advertising Analytics API
 * Epic 33 - Advertising Analytics
 * Story 33.8-FE: Integration Testing - Test Mocks
 *
 * Provides mock handlers for testing advertising analytics hooks and components.
 */

import { http, HttpResponse } from 'msw'
import type {
  AdvertisingAnalyticsResponse,
  AdvertisingItem,
  AdvertisingSummary,
  AdvertisingMeta,
  CampaignsResponse,
  Campaign,
  SyncStatusResponse,
} from '@/types/advertising-analytics'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// ============================================================================
// Mock Data
// ============================================================================

/**
 * Mock advertising summary data
 */
export const mockAdvertisingSummary: AdvertisingSummary = {
  total_spend: 125000,
  total_sales: 600000,  // Epic 35: Total sales (organic + ad)
  total_revenue: 450000,  // Ad-attributed revenue only
  total_profit: 85000,
  overall_roas: 3.6,
  overall_roi: 0.46,
  avg_ctr: 2.5,
  avg_conversion_rate: 4.2,
  campaign_count: 10,
  active_campaigns: 8,
  // Epic 35: Organic vs advertising split
  total_organic_sales: 150000,  // 600000 - 450000
  avg_organic_contribution: 25,  // 25% average organic contribution (backend returns percentage, not decimal)
}

/**
 * Mock advertising meta data
 */
export const mockAdvertisingMeta: AdvertisingMeta = {
  cabinet_id: 'test-cabinet-id',
  date_range: {
    from: '2025-12-08',
    to: '2025-12-21',
  },
  view_by: 'sku',
  last_sync: '2025-12-21T06:00:00Z',
}

/**
 * Mock advertising items
 */
export const mockAdvertisingItems: AdvertisingItem[] = [
  {
    key: 'sku:123456',
    sku_id: '123456',
    product_name: 'Товар с отличным ROAS',
    views: 10000,
    clicks: 300,
    orders: 45,
    spend: 5000,
    total_sales: 35000,  // Epic 35: Total sales (organic + ad)
    revenue: 27000,  // Ad-attributed revenue only
    profit: 6500,
    // Epic 35: Organic split
    organic_sales: 8000,  // 35000 - 27000
    organic_contribution: 22.9,  // 22.9% organic (backend returns percentage)
    roas: 5.4,
    roi: 1.3,
    ctr: 3.0,
    cpc: 16.67,
    conversion_rate: 15.0,
    profit_after_ads: 1500,
    efficiency_status: 'excellent',
  },
  {
    key: 'sku:234567',
    sku_id: '234567',
    product_name: 'Товар с хорошим ROAS',
    views: 8000,
    clicks: 200,
    orders: 30,
    spend: 4000,
    total_sales: 20000,  // Epic 35: Total sales
    revenue: 15000,  // Ad-attributed revenue
    profit: 4000,
    organic_sales: 5000,  // 25% organic
    organic_contribution: 25,  // 25% organic (backend returns percentage)
    roas: 3.75,
    roi: 0.75,
    ctr: 2.5,
    cpc: 20.0,
    conversion_rate: 15.0,
    profit_after_ads: 0,
    efficiency_status: 'good',
  },
  {
    key: 'sku:345678',
    sku_id: '345678',
    product_name: 'Товар с умеренным ROAS',
    views: 5000,
    clicks: 100,
    orders: 12,
    spend: 3000,
    total_sales: 10000,  // Epic 35: Total sales
    revenue: 7500,  // Ad-attributed revenue
    profit: 2000,
    organic_sales: 2500,  // 25% organic
    organic_contribution: 25,  // Backend returns percentage
    roas: 2.5,
    roi: 0.33,
    ctr: 2.0,
    cpc: 30.0,
    conversion_rate: 12.0,
    profit_after_ads: -1000,
    efficiency_status: 'moderate',
  },
  {
    key: 'sku:456789',
    sku_id: '456789',
    product_name: 'Товар со слабым ROAS',
    views: 3000,
    clicks: 50,
    orders: 5,
    spend: 2500,
    total_sales: 5000,  // Epic 35: Total sales
    revenue: 3750,  // Ad-attributed revenue
    profit: 1000,
    organic_sales: 1250,  // 25% organic
    organic_contribution: 25,  // Backend returns percentage
    roas: 1.5,
    roi: 0.1,
    ctr: 1.67,
    cpc: 50.0,
    conversion_rate: 10.0,
    profit_after_ads: -1500,
    efficiency_status: 'poor',
  },
  {
    key: 'sku:567890',
    sku_id: '567890',
    product_name: 'Убыточный товар',
    views: 2000,
    clicks: 30,
    orders: 2,
    spend: 2000,
    total_sales: 2000,  // Epic 35: Total sales
    revenue: 1500,  // Ad-attributed revenue
    profit: 500,
    organic_sales: 500,  // 25% organic
    organic_contribution: 25,  // Backend returns percentage
    roas: 0.75,
    roi: -0.25,
    ctr: 1.5,
    cpc: 66.67,
    conversion_rate: 6.67,
    profit_after_ads: -1500,
    efficiency_status: 'loss',
  },
  {
    key: 'sku:678901',
    sku_id: '678901',
    product_name: 'Товар без данных о прибыли',
    views: 1000,
    clicks: 20,
    orders: 3,
    spend: 1000,
    total_sales: 3000,  // Epic 35: Total sales
    revenue: 2500,  // Ad-attributed revenue
    profit: 0,
    organic_sales: 500,  // 16.7% organic
    organic_contribution: 16.7,  // Backend returns percentage
    roas: 0,
    roi: 0,
    ctr: 2.0,
    cpc: 50.0,
    conversion_rate: 15.0,
    profit_after_ads: 0,
    efficiency_status: 'unknown',
  },
]

/**
 * Full mock response for advertising analytics
 */
export const mockAdvertisingResponse: AdvertisingAnalyticsResponse = {
  meta: mockAdvertisingMeta,
  summary: mockAdvertisingSummary,
  data: mockAdvertisingItems,
}

/**
 * Empty response for testing empty states
 */
export const mockEmptyAdvertisingResponse: AdvertisingAnalyticsResponse = {
  meta: mockAdvertisingMeta,
  summary: {
    total_spend: 0,
    total_sales: 0,
    total_revenue: 0,
    total_profit: 0,
    overall_roas: 0,
    overall_roi: 0,
    avg_ctr: 0,
    avg_conversion_rate: 0,
    campaign_count: 0,
    active_campaigns: 0,
    total_organic_sales: 0,
    avg_organic_contribution: 0,
  },
  data: [],
}

/**
 * Mock campaigns data
 */
export const mockCampaigns: Campaign[] = [
  {
    campaign_id: 1001,
    name: 'Осенняя распродажа',
    type: 8,
    type_name: 'Авто',
    status: 9,
    status_name: 'Активна',
    created_at: '2025-09-01T10:00:00Z',
    start_time: '2025-09-01T10:00:00Z',
    end_time: null,
    daily_budget: 5000,
    nm_ids: ['123456', '234567'],
    sku_count: 2,
    placements: null,  // Legacy campaign (type 8) - no placement data
  },
  {
    campaign_id: 1002,
    name: 'Зимние товары',
    type: 9,
    type_name: 'Аукцион',
    status: 9,
    status_name: 'Активна',
    created_at: '2025-11-15T10:00:00Z',
    start_time: '2025-11-15T10:00:00Z',
    end_time: null,
    daily_budget: 3000,
    nm_ids: ['345678'],
    sku_count: 1,
    placements: {
      search: true,
      recommendations: false,
    },  // Type 9 campaign - search only
  },
  {
    campaign_id: 1003,
    name: 'Старая кампания',
    type: 8,
    type_name: 'Авто',
    status: 11,
    status_name: 'На паузе',
    created_at: '2025-06-01T10:00:00Z',
    start_time: '2025-06-01T10:00:00Z',
    end_time: null,
    daily_budget: 2000,
    nm_ids: ['456789', '567890'],
    sku_count: 2,
    placements: null,  // Legacy campaign (type 8) - no placement data
  },
  {
    campaign_id: 1004,
    name: 'Новогодняя витрина + карусель',
    type: 9,
    type_name: 'Аукцион',
    status: 9,
    status_name: 'Активна',
    created_at: '2025-12-01T10:00:00Z',
    start_time: '2025-12-01T10:00:00Z',
    end_time: null,
    daily_budget: 10000,
    nm_ids: ['789012', '890123', '901234'],
    sku_count: 3,
    placements: {
      search: false,
      recommendations: true,
      carousel: true,
    },  // Type 9 campaign - recommendations + carousel (showcase focus)
  },
]

/**
 * Mock campaigns response
 */
export const mockCampaignsResponse: CampaignsResponse = {
  meta: {
    cabinet_id: 'test-cabinet-id',
    total_count: 4,
    active_count: 3,  // campaigns 1001, 1002, 1004 are active (status 9)
  },
  data: mockCampaigns,
}

/**
 * Mock sync status response
 * Updated to match actual backend response format (Request #72)
 */
export const mockSyncStatusResponse: SyncStatusResponse = {
  lastSyncAt: '2025-12-21T06:00:00Z',
  nextScheduledSync: '2025-12-22T04:00:00Z',
  status: 'completed',
  lastTask: {
    taskUuid: 'adv-sync-test-123',
    status: 'completed',
    startedAt: '2025-12-21T05:55:00Z',
    finishedAt: '2025-12-21T06:00:00Z',
    error: null,
  },
  campaignsSynced: 10,
  dataAvailableFrom: '2025-11-01',
  dataAvailableTo: '2025-12-21',
}

// ============================================================================
// MSW Handlers
// ============================================================================

export const advertisingHandlers = [
  // GET /v1/analytics/advertising
  // Returns backend format (camelCase) to test adapter in advertising-analytics.ts
  http.get(`${API_BASE_URL}/v1/analytics/advertising`, ({ request }) => {
    const url = new URL(request.url)
    const efficiencyFilter = url.searchParams.get('efficiency_filter')
    const from = url.searchParams.get('from') || '2025-12-08'
    const to = url.searchParams.get('to') || '2025-12-21'
    const viewBy = url.searchParams.get('view_by') || 'sku'

    let items = [...mockAdvertisingItems]

    // Apply efficiency filter if provided
    if (efficiencyFilter && efficiencyFilter !== 'all') {
      items = items.filter((item) => item.efficiency_status === efficiencyFilter)
    }

    // Convert frontend format to backend format (camelCase)
    const backendItems = items.map((item) => ({
      key: `sku:${item.sku_id}`,
      nmId: parseInt(item.sku_id || '0'),
      label: item.product_name,
      views: item.views,
      clicks: item.clicks,
      orders: item.orders,
      spend: item.spend,
      revenue: item.revenue,
      profit: item.profit,
      roas: item.roas,
      roi: item.roi,
      ctr: item.ctr,
      cpc: item.cpc,
      conversionRate: item.conversion_rate,
      profitAfterAds: item.profit_after_ads,
      efficiency: {
        status: item.efficiency_status,
      },
    }))

    // Return backend format (Request #74)
    return HttpResponse.json({
      items: backendItems,
      summary: {
        totalSpend: mockAdvertisingSummary.total_spend,
        totalRevenue: mockAdvertisingSummary.total_revenue,
        totalProfit: mockAdvertisingSummary.total_profit,
        avgRoas: mockAdvertisingSummary.overall_roas,
        avgRoi: mockAdvertisingSummary.overall_roi,
        avgCtr: mockAdvertisingSummary.avg_ctr,
        avgConversionRate: mockAdvertisingSummary.avg_conversion_rate,
        campaignCount: mockAdvertisingSummary.campaign_count,
        activeCampaigns: mockAdvertisingSummary.active_campaigns,
      },
      query: {
        cabinetId: 'test-cabinet-id',
        from,
        to,
        viewBy,
      },
      pagination: {
        total: items.length,
        limit: 100,
        offset: 0,
      },
      cachedAt: '2025-12-21T06:00:00Z',
    })
  }),

  // GET /v1/analytics/advertising/campaigns
  // Returns backend format (campaigns array) to test adapter
  http.get(`${API_BASE_URL}/v1/analytics/advertising/campaigns`, () => {
    // Backend format (matching real WB API response)
    const backendResponse = {
      campaigns: mockCampaigns.map((campaign) => ({
        id: `campaign-${campaign.campaign_id}`,
        advertId: campaign.campaign_id,
        name: campaign.name || '',
        type: campaign.type,
        typeLabel: campaign.type_name?.toLowerCase() || 'unknown',
        status: campaign.status,
        statusLabel: campaign.status_name?.toLowerCase() || 'unknown',
        nmIds: campaign.nm_ids?.map((id) => parseInt(id)) || [],
        productsCount: campaign.sku_count || campaign.nm_ids?.length || 0,
        budget: null,
        dailyBudget: campaign.daily_budget || 0,
        startDate: campaign.start_time?.split('T')[0] || '2025-01-01',
        endDate: campaign.end_time?.split('T')[0] || '2025-12-31',
        createdAt: campaign.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      total: mockCampaigns.length,
      limit: 50,
      offset: 0,
    }
    return HttpResponse.json(backendResponse)
  }),

  // GET /v1/analytics/advertising/sync-status
  http.get(`${API_BASE_URL}/v1/analytics/advertising/sync-status`, () => {
    return HttpResponse.json(mockSyncStatusResponse)
  }),
]

/**
 * Error handlers for testing error states
 */
export const advertisingErrorHandlers = [
  http.get(`${API_BASE_URL}/v1/analytics/advertising`, () => {
    return HttpResponse.json(
      { error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 }
    )
  }),

  http.get(`${API_BASE_URL}/v1/analytics/advertising/campaigns`, () => {
    return HttpResponse.json(
      { error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 }
    )
  }),

  http.get(`${API_BASE_URL}/v1/analytics/advertising/sync-status`, () => {
    return HttpResponse.json(
      { error: { code: 'INTERNAL', message: 'Internal server error' } },
      { status: 500 }
    )
  }),
]
