import { logger } from '@/lib/logger'
'use client'

/**
 * Hook for margin analytics by brand
 * Story 4.6: Margin Analysis by Brand
 * Epic 74: Extracted from useMarginAnalytics.ts for file size compliance
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { MarginAnalyticsAggregatedResponse } from '@/types/api'
import type { MarginAnalyticsFilters } from './margin-analytics-query-keys'
import {
  MARGIN_ANALYTICS_QUERY_CONFIG,
  buildMarginAnalyticsParams,
  extractItems,
} from './margin-analytics-query-keys'

/**
 * Hook to fetch margin analytics by brand
 * Story 6.1-FE: Supports weekStart/weekEnd for date range queries
 *
 * @returns Query result with aggregated margin data by brand
 */
export function useMarginAnalyticsByBrand(filters: MarginAnalyticsFilters) {
  const {
    week,
    weekStart,
    weekEnd,
    compareTo,
    compareToStart,
    compareToEnd,
    includeCogs = true,
  } = filters

  const isRangeQuery = weekStart && weekEnd
  const effectiveWeek = week || weekStart || ''
  const isComparisonMode = !!(compareTo || (compareToStart && compareToEnd))

  return useQuery({
    queryKey: [
      'analytics',
      'margin',
      'by-brand',
      {
        week: effectiveWeek,
        weekStart,
        weekEnd,
        compareTo,
        compareToStart,
        compareToEnd,
        includeCogs,
        cursor: filters.cursor,
        limit: filters.limit ?? 50,
      },
    ],
    queryFn: async (): Promise<MarginAnalyticsAggregatedResponse> => {
      try {
        const params = buildMarginAnalyticsParams(filters)

        logger.debug('[Margin Analytics] Fetching brand analytics:', {
          week: isRangeQuery ? `${weekStart} — ${weekEnd}` : week,
          isRangeQuery,
          isComparisonMode,
          includeCogs,
        })

        const response = await apiClient.get<any[] | { items?: any[]; data?: any[]; meta?: any }>(
          `/v1/analytics/weekly/by-brand?${params.toString()}`
        )

        const { items, meta } = extractItems(response)

        // Transform response — Epic 26: operating expenses, Request #69: revenue_gross
        const transformed: MarginAnalyticsAggregatedResponse = {
          data: items.map((item: any) => mapBrandItem(item)),
          meta,
        }

        logger.debug('[Margin Analytics] Brand analytics received:', {
          count: transformed.data.length,
          hasOperatingMargin: transformed.data.some(d => d.operating_margin_pct != null),
        })

        return transformed
      } catch (error) {
        console.error('[Margin Analytics] Failed to fetch brand analytics:', error)
        throw error
      }
    },
    ...MARGIN_ANALYTICS_QUERY_CONFIG,
    enabled: !!(week || (weekStart && weekEnd)),
  })
}

/** Map a single brand API item to the frontend response shape */
function mapBrandItem(item: any) {
  return {
    brand: item.brand,
    revenue_gross: item.revenue_gross, // Request #69: already a number from Brand API
    revenue_net: item.revenue_net,
    qty: item.total_units,
    total_skus: item.total_skus, // Unique SKU count for "Товаров (SKU)" column
    cogs: item.cogs,
    profit: item.profit,
    margin_pct: item.margin_pct,
    markup_percent: item.markup_percent,
    missing_cogs_count: item.missing_cogs_count,
    // Epic 26: Operating expenses and profit
    storage_cost: item.storage_cost,
    penalties: item.penalties,
    paid_acceptance_cost: item.paid_acceptance_cost,
    acquiring_fee: item.acquiring_fee,
    loyalty_fee: item.loyalty_fee,
    loyalty_compensation: item.loyalty_compensation,
    commission: item.commission,
    other_adjustments: item.other_adjustments,
    total_expenses: item.total_expenses,
    operating_profit: item.operating_profit,
    operating_margin_pct: item.operating_margin_pct,
    skus_with_expenses_only: item.skus_with_expenses_only,
  }
}
