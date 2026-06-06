import { logger } from '@/lib/logger'
'use client'

/**
 * Hook for margin analytics by SKU
 * Story 4.5: Margin Analysis by SKU
 * Epic 74: Extracted from useMarginAnalytics.ts for file size compliance
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { MarginAnalyticsSkuResponse } from '@/types/api'
import type { MarginAnalyticsFilters } from './margin-analytics-query-keys'
import {
  MARGIN_ANALYTICS_QUERY_CONFIG,
  buildMarginAnalyticsParams,
  extractItems,
} from './margin-analytics-query-keys'

/**
 * Hook to fetch margin analytics by SKU
 * Story 6.1-FE: Supports weekStart/weekEnd for date range queries
 *
 * @returns Query result with margin data for each SKU
 */
export function useMarginAnalyticsBySku(filters: MarginAnalyticsFilters) {
  const {
    week,
    weekStart,
    weekEnd,
    compareTo,
    compareToStart,
    compareToEnd,
    includeCogs = true,
    cursor,
    limit = 50,
    nmId,
  } = filters

  const isRangeQuery = weekStart && weekEnd
  const effectiveWeek = week || weekStart || ''
  const isComparisonMode = !!(compareTo || (compareToStart && compareToEnd))

  return useQuery({
    queryKey: [
      'analytics',
      'margin',
      'by-sku',
      {
        week: effectiveWeek,
        weekStart,
        weekEnd,
        compareTo,
        compareToStart,
        compareToEnd,
        includeCogs,
        cursor,
        limit,
        nmId,
      },
    ],
    queryFn: async (): Promise<MarginAnalyticsSkuResponse> => {
      try {
        const params = buildMarginAnalyticsParams(filters)

        logger.debug('[Margin Analytics] Fetching SKU analytics:', {
          week: isRangeQuery ? `${weekStart} — ${weekEnd}` : week,
          isRangeQuery,
          isComparisonMode,
          includeCogs,
          cursor,
          limit,
          nmId: nmId ?? 'all',
        })

        const response = await apiClient.get<any[] | { items?: any[]; data?: any[]; meta?: any }>(
          `/v1/analytics/weekly/by-sku?${params.toString()}`
        )

        const { items, meta } = extractItems(response)

        // Transform response — Request #60: Include operational costs per SKU
        let transformedData = items.map((item: any) => mapSkuItem(item))

        // Story 4.9: Client-side filtering by nm_id
        if (nmId) {
          transformedData = transformedData.filter(item => String(item.nm_id) === String(nmId))
          logger.debug('[Margin Analytics] Filtered by nm_id:', {
            nmId,
            matchCount: transformedData.length,
          })
        }

        const transformed: MarginAnalyticsSkuResponse = { data: transformedData, meta }

        logger.debug('[Margin Analytics] SKU analytics received:', {
          count: transformed.data.length,
          has_cogs_data: transformed.data.some(item => item.cogs !== undefined),
        })

        return transformed
      } catch (error) {
        console.error('[Margin Analytics] Failed to fetch SKU analytics:', error)
        throw error
      }
    },
    ...MARGIN_ANALYTICS_QUERY_CONFIG,
    enabled: !!(week || (weekStart && weekEnd)),
  })
}

/** Map a single SKU API item to the frontend response shape */
function mapSkuItem(item: any) {
  return {
    nm_id: item.nm_id,
    sa_name: item.sa_name,
    revenue_net: item.revenue_net,
    qty: item.total_units,
    cogs: item.cogs,
    profit: item.profit,
    margin_pct: item.margin_pct,
    markup_percent: item.markup_percent,
    missing_cogs_flag: item.missing_cogs_flag || false,
    // Story 6.3-FE: ROI & Profit per Unit
    profit_per_unit: item.profit_per_unit,
    roi: item.roi,
    // DEFER-001: Weeks coverage
    weeks_with_sales: item.weeks_with_sales,
    weeks_with_cogs: item.weeks_with_cogs,
    // Request #60 / Epic 26: Operational costs per SKU
    logistics_cost_rub: item.logistics_cost ? String(item.logistics_cost) : undefined,
    storage_cost_rub: item.storage_cost ? String(item.storage_cost) : undefined,
    penalties_rub: item.penalties ? String(item.penalties) : undefined,
    paid_acceptance_cost_rub: item.paid_acceptance_cost
      ? String(item.paid_acceptance_cost)
      : undefined,
    advertising_cost_rub: item.advertising_cost ? String(item.advertising_cost) : undefined,
    // Epic 30: Calculated totals from backend
    total_expenses_rub: item.total_expenses ? String(item.total_expenses) : undefined,
    total_expenses: item.total_expenses,
    operating_profit_rub: item.operating_profit ? String(item.operating_profit) : undefined,
    operating_profit: item.operating_profit,
    operating_margin_pct: item.operating_margin_pct,
    has_revenue: item.has_revenue,
    // Epic 30: Net profit fields
    net_profit: item.net_profit,
    net_margin_pct: item.net_margin_pct,
    storage_data_source: item.storage_data_source,
  }
}
