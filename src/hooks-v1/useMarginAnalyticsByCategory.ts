'use client'

/**
 * Hook for margin analytics by category
 * Story 4.6: Margin Analysis by Category
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
 * Hook to fetch margin analytics by category
 * Story 6.1-FE: Supports weekStart/weekEnd for date range queries
 *
 * @returns Query result with aggregated margin data by category
 */
export function useMarginAnalyticsByCategory(filters: MarginAnalyticsFilters) {
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
      'by-category',
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

        console.info('[Margin Analytics] Fetching category analytics:', {
          week: isRangeQuery ? `${weekStart} — ${weekEnd}` : week,
          isRangeQuery,
          isComparisonMode,
          includeCogs,
        })

        const response = await apiClient.get<any[] | { items?: any[]; data?: any[]; meta?: any }>(
          `/v1/analytics/weekly/by-category?${params.toString()}`
        )

        const { items, meta } = extractItems(response)

        // Transform response — Epic 26: operating expenses, Request #69: revenue_gross
        const transformed: MarginAnalyticsAggregatedResponse = {
          data: items.map((item: any) => mapCategoryItem(item)),
          meta,
        }

        console.info('[Margin Analytics] Category analytics received:', {
          count: transformed.data.length,
          hasOperatingMargin: transformed.data.some(d => d.operating_margin_pct != null),
        })

        return transformed
      } catch (error) {
        console.error('[Margin Analytics] Failed to fetch category analytics:', error)
        throw error
      }
    },
    ...MARGIN_ANALYTICS_QUERY_CONFIG,
    enabled: !!(week || (weekStart && weekEnd)),
  })
}

/** Map a single category API item to the frontend response shape */
function mapCategoryItem(item: any) {
  return {
    category: item.subject_name,
    revenue_gross: item.revenue_gross_rub ? parseFloat(item.revenue_gross_rub) : undefined,
    revenue_net: parseFloat(item.revenue_net_rub || '0'),
    qty: item.total_units ?? item.sku_count, // Fix: use total_units for profit_per_unit calc
    total_skus: item.sku_count, // Unique SKU count for "Товаров (SKU)" column
    cogs: item.cogs_rub ? parseFloat(item.cogs_rub) : undefined,
    profit: item.profit_rub ? parseFloat(item.profit_rub) : undefined,
    margin_pct: item.margin_pct,
    markup_percent: item.markup_percent,
    missing_cogs_count: item.missing_cogs_count,
    // Epic 26: Operating expenses and profit
    storage_cost: item.storage_cost_rub ? parseFloat(item.storage_cost_rub) : undefined,
    penalties: item.penalties_rub ? parseFloat(item.penalties_rub) : undefined,
    paid_acceptance_cost: item.paid_acceptance_cost_rub
      ? parseFloat(item.paid_acceptance_cost_rub)
      : undefined,
    acquiring_fee: item.acquiring_fee_rub ? parseFloat(item.acquiring_fee_rub) : undefined,
    loyalty_fee: item.loyalty_fee_rub ? parseFloat(item.loyalty_fee_rub) : undefined,
    loyalty_compensation: item.loyalty_compensation_rub
      ? parseFloat(item.loyalty_compensation_rub)
      : undefined,
    commission: item.commission_rub ? parseFloat(item.commission_rub) : undefined,
    other_adjustments: item.other_adjustments_rub
      ? parseFloat(item.other_adjustments_rub)
      : undefined,
    total_expenses: item.total_expenses_rub ? parseFloat(item.total_expenses_rub) : undefined,
    operating_profit: item.operating_profit_rub ? parseFloat(item.operating_profit_rub) : undefined,
    operating_margin_pct: item.operating_margin_pct,
    skus_with_expenses_only: item.skus_with_expenses_only,
  }
}
