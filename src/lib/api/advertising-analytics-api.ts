/**
 * Advertising Analytics API - Core analytics endpoint and error handling
 *
 * Extracted from advertising-analytics.ts for Epic 74 file size compliance.
 * @see Story 33.1-fe: Types & API Client
 */

import { apiClient } from '../api-client'
import type {
  AdvertisingAnalyticsParams,
  AdvertisingAnalyticsResponse,
  ViewByMode,
} from '@/types/advertising-analytics'

/** Localized error messages for advertising analytics API errors (AC4). */
export const advertisingErrorMessages: Record<number, string> = {
  400: 'Неверные параметры запроса',
  401: 'Требуется авторизация',
  403: 'Нет доступа к этому кабинету',
  404: 'Данные не найдены',
  500: 'Ошибка сервера. Попробуйте позже',
}

/** Get localized error message for HTTP status code. */
export function getAdvertisingErrorMessage(statusCode: number): string {
  return advertisingErrorMessages[statusCode] ?? 'Произошла неизвестная ошибка'
}

/**
 * Build query string from params object. Filters out undefined/null values.
 * Arrays sent as repeated params. Single-element arrays duplicated for NestJS array parsing.
 */
export function buildQueryString(params: Record<string, unknown>): string {
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
        value.forEach(item => {
          searchParams.append(key, String(item))
        })
      }
    } else {
      searchParams.append(key, String(value))
    }
  }

  return searchParams.toString()
}

/**
 * Get advertising analytics data. GET /v1/analytics/advertising
 * Returns performance metrics aggregated by the specified view_by mode.
 */
export async function getAdvertisingAnalytics(
  params: AdvertisingAnalyticsParams
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
    include_daily: params.include_daily ?? false,
  })

  // Story 33.1-fe: Use skipDataUnwrap to get full response
  const backendResponse = await apiClient.get<any>(`/v1/analytics/advertising?${queryParams}`, {
    skipDataUnwrap: true,
  })

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
      overall_roas: backendResponse.summary?.avgRoas ?? null,
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
    // Request #157: Daily breakdown (present when include_daily=true)
    daily: backendResponse.daily?.map((day: any) => ({
      date: day.date,
      spend: day.spend ?? 0,
      views: day.views ?? 0,
      clicks: day.clicks ?? 0,
      orders: day.orders ?? 0,
      ctr: day.ctr,
      cpc: day.cpc,
      revenue_attributed: day.revenueAttributed,
    })),
    // Story 72.4: Multi-campaign SKU warnings (auto-returned when deduplication detects overlaps)
    multiCampaignSkuWarnings: backendResponse.multiCampaignSkuWarnings?.map((w: any) => ({
      nmId: w.nmId,
      campaigns: w.campaigns ?? [],
      message: w.message ?? '',
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
