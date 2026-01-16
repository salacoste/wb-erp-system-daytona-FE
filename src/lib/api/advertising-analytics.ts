/**
 * Advertising Analytics API Client
 *
 * API client functions for advertising analytics (Epic 33-FE).
 * Based on backend API specification: docs/request-backend/71-advertising-analytics-epic-33.md
 *
 * @see Story 33.1-fe: Types & API Client
 */

import { apiClient } from '../api-client'
import type {
  AdvertisingAnalyticsParams,
  AdvertisingAnalyticsResponse,
  CampaignsParams,
  CampaignsResponse,
  SyncStatusResponse,
  ViewByMode,
} from '@/types/advertising-analytics'

// ============================================================================
// Error Messages (Russian localization per AC4)
// ============================================================================

/**
 * Localized error messages for advertising analytics API errors.
 * @see Story 33.1-fe AC4: Error Handling (Localized)
 */
export const advertisingErrorMessages: Record<number, string> = {
  400: 'Неверные параметры запроса',
  401: 'Требуется авторизация',
  403: 'Нет доступа к этому кабинету',
  404: 'Данные не найдены',
  500: 'Ошибка сервера. Попробуйте позже',
}

/**
 * Get localized error message for HTTP status code.
 */
export function getAdvertisingErrorMessage(statusCode: number): string {
  return advertisingErrorMessages[statusCode] ?? 'Произошла неизвестная ошибка'
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build query string from params object.
 * Filters out undefined/null values and handles arrays.
 *
 * Arrays are sent as repeated parameters (e.g., campaign_ids=1&campaign_ids=2)
 * to match backend validation which expects array format.
 *
 * IMPORTANT: NestJS quirk - when query param appears only once, it's parsed as string (not array).
 * For single-element arrays, we send the parameter twice to force array parsing.
 */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue

    if (Array.isArray(value)) {
      if (value.length === 0) continue

      // NestJS quirk: single param = string, repeated param = array
      // For arrays with 1 element, send parameter twice to force array parsing
      if (value.length === 1) {
        searchParams.append(key, String(value[0]))
        searchParams.append(key, String(value[0]))
      } else {
        value.forEach((item) => {
          searchParams.append(key, String(item))
        })
      }
    } else {
      searchParams.append(key, String(value))
    }
  }

  return searchParams.toString()
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get advertising analytics data.
 * GET /v1/analytics/advertising
 *
 * Returns performance metrics aggregated by the specified view_by mode.
 *
 * @param params - Query parameters including date range, view_by, filters, sorting, pagination
 * @returns Analytics response with meta, summary, and data items
 *
 * @example
 * // Get SKU-level metrics for last 14 days
 * const data = await getAdvertisingAnalytics({
 *   from: '2025-12-08',
 *   to: '2025-12-21',
 *   view_by: 'sku',
 *   sort_by: 'spend',
 *   sort_order: 'desc',
 *   limit: 20,
 * });
 *
 * @example
 * // Filter by efficiency status
 * const excellentItems = await getAdvertisingAnalytics({
 *   from: '2025-12-01',
 *   to: '2025-12-21',
 *   efficiency_filter: 'excellent',
 * });
 */
export async function getAdvertisingAnalytics(
  params: AdvertisingAnalyticsParams,
): Promise<AdvertisingAnalyticsResponse> {
  // Request #76: Backend now supports efficiency_filter (server-side filtering)
  const queryParams = buildQueryString({ ...params })

  console.info('[Advertising Analytics] Fetching analytics:', {
    from: params.from,
    to: params.to,
    view_by: params.view_by ?? 'sku',
    group_by: params.group_by ?? 'sku', // Epic 36: Log grouping mode
    efficiency_filter: params.efficiency_filter ?? 'all',
    sort_by: params.sort_by ?? 'spend',
    sort_order: params.sort_order ?? 'desc',
  })

  // Story 33.1-fe: Use skipDataUnwrap to get full response
  const backendResponse = await apiClient.get<any>(
    `/v1/analytics/advertising?${queryParams}`,
    { skipDataUnwrap: true },
  )

  // ADAPTER: Backend returns different format (camelCase, "items" instead of "data")
  // Adapt backend response to match frontend types
  const response: AdvertisingAnalyticsResponse = {
    meta: {
      cabinet_id: backendResponse.query?.cabinetId || 'unknown',
      date_range: {
        from: backendResponse.query?.from || params.from,
        to: backendResponse.query?.to || params.to,
      },
      view_by: (backendResponse.query?.viewBy || params.view_by || 'sku') as ViewByMode,
      last_sync: backendResponse.cachedAt || new Date().toISOString(),
    },
    summary: {
      total_spend: backendResponse.summary?.totalSpend ?? 0,
      // Epic 35: Backend now returns totalSales (hybrid query: completed weeks + current week)
      total_sales: backendResponse.summary?.totalSales ?? 0,
      total_revenue: backendResponse.summary?.totalRevenue ?? 0,
      total_profit: backendResponse.summary?.totalProfit ?? 0,
      overall_roas: backendResponse.summary?.avgRoas ?? 0,
      overall_roi: backendResponse.summary?.avgRoi ?? 0,
      avg_ctr: backendResponse.summary?.avgCtr ?? 0,
      avg_conversion_rate: backendResponse.summary?.avgConversionRate ?? 0,
      campaign_count: backendResponse.summary?.campaignCount ?? 0,
      active_campaigns: backendResponse.summary?.activeCampaigns ?? 0,
      // Epic 35: Organic vs advertising split
      total_organic_sales: backendResponse.summary?.totalOrganicSales ?? 0,
      avg_organic_contribution: backendResponse.summary?.avgOrganicContribution ?? 0,
    },
    data: (backendResponse.items || []).map((item: any, index: number) => ({
      // Use backend's unique key as identifier (e.g., "sku:270937054", "campaign:12345")
      key: item.key || `item-${index}`,

      // Epic 36: Product Card Linking fields
      type: item.type, // 'merged_group' | 'individual' | undefined
      imtId: item.imtId ?? null, // number | null
      mergedProducts: item.mergedProducts?.map((p: any) => ({
        nmId: p.nmId,
        vendorCode: p.vendorCode,
      })),

      sku_id: item.nmId?.toString(),
      campaign_id: item.campaignId?.toString(),
      product_name: item.label,
      brand: item.brand,
      category: item.category,
      views: item.views ?? 0,
      clicks: item.clicks ?? 0,
      orders: item.orders ?? 0,
      spend: item.spend ?? 0,
      // Epic 35: Backend now returns totalSales (hybrid query: completed weeks + current week)
      total_sales: item.totalSales ?? 0,
      revenue: item.revenue ?? 0,
      profit: item.profit ?? 0,
      // Epic 35: Organic vs advertising split
      organic_sales: item.organicSales ?? 0,
      organic_contribution: item.organicContribution ?? 0,
      roas: item.roas ?? 0,
      roi: item.roi ?? 0,
      ctr: item.ctr ?? 0,
      cpc: item.cpc ?? 0,
      conversion_rate: item.conversionRate ?? 0,
      profit_after_ads: item.profitAfterAds ?? 0,
      efficiency_status: item.efficiency?.status || 'unknown',
    })),
  }

  console.info('[Advertising Analytics] Response:', {
    itemCount: response.data?.length ?? 0,
    totalSpend: response.summary?.total_spend ?? 0,
    overallRoas: response.summary?.overall_roas ?? 0,
    viewBy: response.meta?.view_by ?? 'unknown',
    groupBy: params.group_by ?? 'sku', // Epic 36: Log actual grouping
    efficiencyFilter: params.efficiency_filter ?? 'all',
  })

  return response
}

/**
 * Get list of advertising campaigns.
 * GET /v1/analytics/advertising/campaigns
 *
 * Returns campaigns for the cabinet with optional filtering.
 *
 * @param params - Optional query parameters for filtering and pagination
 * @returns Campaigns response with meta and campaign list
 *
 * @example
 * // Get all campaigns
 * const campaigns = await getAdvertisingCampaigns();
 *
 * @example
 * // Get only active campaigns
 * const activeCampaigns = await getAdvertisingCampaigns({
 *   status: '9',  // 9 = active
 * });
 *
 * @example
 * // Search by name with pagination
 * const searchResults = await getAdvertisingCampaigns({
 *   search: 'Autumn',
 *   limit: 10,
 *   offset: 0,
 * });
 */
export async function getAdvertisingCampaigns(
  params?: CampaignsParams,
): Promise<CampaignsResponse> {
  const queryParams = params ? buildQueryString({ ...params }) : ''
  const url = queryParams
    ? `/v1/analytics/advertising/campaigns?${queryParams}`
    : '/v1/analytics/advertising/campaigns'

  console.info('[Advertising Analytics] Fetching campaigns:', {
    status: params?.status ?? 'all',
    type: params?.type ?? 'all',
    search: params?.search ?? '',
    limit: params?.limit ?? 'default',
    offset: params?.offset ?? 0,
  })

  // Backend format (snake_case with campaigns array)
  interface BackendCampaignsResponse {
    campaigns: Array<{
      id: string
      advertId: number
      name: string
      type: number
      typeLabel: string
      status: number
      statusLabel: string
      nmIds: number[]
      productsCount: number
      budget: number | null
      dailyBudget: number
      startDate: string
      endDate: string
      createdAt: string
      updatedAt: string
      placements?: { // Story 33.9 - Request #79: Type 9 campaigns only
        search: boolean
        recommendations: boolean
        carousel?: boolean
      } | null
    }>
    total: number
    limit: number
    offset: number
  }

  // Story 33.1-fe: Fetch backend response
  const backendResponse = await apiClient.get<BackendCampaignsResponse>(url, {
    skipDataUnwrap: true,
  })

  // Adapt backend format to frontend format (Campaign interface from types/advertising-analytics.ts:194)
  const response: CampaignsResponse = {
    meta: {
      cabinet_id: '', // TODO: Get from auth context
      total_count: backendResponse.total,
      active_count: backendResponse.campaigns.filter((c) => c.status === 9).length,
    },
    data: backendResponse.campaigns.map((campaign) => ({
      campaign_id: campaign.advertId,
      name: campaign.name, // Used by sortCampaignsByStatus
      type: campaign.type,
      type_name: campaign.typeLabel || 'Неизвестно',
      status: campaign.status,
      status_name: campaign.statusLabel || 'Неизвестно',
      created_at: campaign.createdAt,
      start_time: campaign.startDate, // Backend returns date string (YYYY-MM-DD)
      end_time: campaign.endDate || null,
      daily_budget: campaign.dailyBudget,
      nm_ids: campaign.nmIds.map(String), // Convert number[] to string[]
      sku_count: campaign.productsCount,
      placements: campaign.placements || null, // Story 33.9 - Request #79: Campaign placements (Type 9 only)
    })),
  }

  console.info('[Advertising Analytics] Campaigns response:', {
    totalCount: response.meta.total_count,
    activeCount: response.meta.active_count,
    returnedCount: response.data.length,
  })

  return response
}

/**
 * Get advertising sync status.
 * GET /v1/analytics/advertising/sync-status
 *
 * Returns the current sync health status including last sync time,
 * sync statistics, and error counts.
 *
 * Note: Backend marks sync as "stale" after 26 hours (24h daily sync + 2h buffer).
 *
 * @returns Sync status response with health status and statistics
 *
 * @example
 * const status = await getAdvertisingSyncStatus();
 *
 * if (status.health_status === 'healthy') {
 *   console.log('Данные актуальны');
 * } else if (status.health_status === 'stale') {
 *   console.log('Нет синхронизации более 26 часов');
 * }
 */
export async function getAdvertisingSyncStatus(): Promise<SyncStatusResponse> {
  console.info('[Advertising Analytics] Fetching sync status')

  // Story 33.1-fe: Use skipDataUnwrap to get full response
  const response = await apiClient.get<SyncStatusResponse>(
    '/v1/analytics/advertising/sync-status',
    { skipDataUnwrap: true },
  )

  console.info('[Advertising Analytics] Sync status:', {
    status: response.status,
    lastSyncAt: response.lastSyncAt ?? 'never',
    campaignsSynced: response.campaignsSynced,
    dataAvailableFrom: response.dataAvailableFrom,
    dataAvailableTo: response.dataAvailableTo,
  })

  return response
}
