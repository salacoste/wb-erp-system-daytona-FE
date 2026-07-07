'use client'

import { logger } from '@/lib/logger'

/**
 * Hook for margin analytics by brand
 * Story 4.6: Margin Analysis by Brand
 * Epic 74: Extracted from useMarginAnalytics.ts for file size compliance
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { MarginAnalyticsAggregated, MarginAnalyticsAggregatedResponse } from '@/types/api'
import type { MarginAnalyticsFilters } from './margin-analytics-query-keys'
import {
  MARGIN_ANALYTICS_QUERY_CONFIG,
  buildMarginAnalyticsParams,
  extractItems,
  type RawMarginAnalyticsResponse,
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
    includeAds = true,
    includeStock = true,
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
        includeAds,
        includeStock,
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
          includeAds,
          includeStock,
        })

        const response = await apiClient.get<unknown[] | RawMarginAnalyticsResponse>(
          `/v1/analytics/weekly/by-brand?${params.toString()}`
        )

        const { items, meta } = extractItems(response)

        // Transform response — Epic 26: operating expenses, Request #69: revenue_gross
        const transformed: MarginAnalyticsAggregatedResponse = {
          data: items.map(item => mapBrandItem(item)),
          meta: meta as MarginAnalyticsAggregatedResponse['meta'],
        }

        logger.debug('[Margin Analytics] Brand analytics received:', {
          count: transformed.data.length,
          hasOperatingMargin: transformed.data.some(d => d.operating_margin_pct != null),
        })

        return transformed
      } catch (error) {
        logger.error('[Margin Analytics] Failed to fetch brand analytics:', error)
        throw error
      }
    },
    ...MARGIN_ANALYTICS_QUERY_CONFIG,
    enabled: !!(week || (weekStart && weekEnd)),
  })
}

/** Raw backend item shape for margin analytics by brand */
interface RawBrandItem {
  brand: string
  revenue_gross: number
  revenue_net: number
  total_units: number
  total_skus: number
  cogs: number | null
  profit: number | null
  margin_pct: number | null
  markup_percent: number | null
  // Backend by-brand returns roi (percent 0-100, null when cogs=0) + profit_per_unit
  roi?: number | null
  profit_per_unit?: number | null
  missing_cogs_count: number
  storage_cost: number | null
  penalties: number | null
  paid_acceptance_cost: number | null
  acquiring_fee: number | null
  loyalty_fee: number | null
  loyalty_compensation: number | null
  commission: number | null
  other_adjustments: number | null
  total_expenses: number | null
  operating_profit: number | null
  operating_margin_pct: number | null
  skus_with_expenses_only: number
  // FR-2..FR-5 competitor-parity fields (contract #219, verified W26)
  advertising_cost?: number | null
  drr_pct?: number | null
  tax_allocated?: number | null
  net_profit_after_tax?: number | null
  net_margin_after_tax_pct?: number | null
  spp_rub?: number | null
  spp_pct?: number | null
  cancellations_qty?: number | null
  stock_fbs?: number | null
  stock_fbo?: number | null
  stock_total?: number | null
  stock_value_rub?: number | null
  stock_value_share_pct?: number | null
}

/** Map a single brand API item to the frontend response shape */
function mapBrandItem(raw: unknown): MarginAnalyticsAggregated {
  const item = raw as RawBrandItem
  return {
    brand: item.brand,
    revenue_gross: item.revenue_gross, // Request #69: already a number from Brand API
    revenue_net: item.revenue_net,
    qty: item.total_units,
    total_skus: item.total_skus, // Unique SKU count for "Товаров (SKU)" column
    cogs: item.cogs ?? undefined,
    profit: item.profit ?? undefined,
    margin_pct: item.margin_pct ?? undefined,
    markup_percent: item.markup_percent ?? undefined,
    // Prefer backend roi/profit_per_unit; MarginAggregatedTableRow falls back to FE recompute (margin-aggregated ROI mapper gap)
    roi: item.roi ?? null,
    profit_per_unit: item.profit_per_unit ?? null,
    missing_cogs_count: item.missing_cogs_count,
    // Epic 26: Operating expenses and profit
    storage_cost: item.storage_cost ?? undefined,
    penalties: item.penalties ?? undefined,
    paid_acceptance_cost: item.paid_acceptance_cost ?? undefined,
    acquiring_fee: item.acquiring_fee ?? undefined,
    loyalty_fee: item.loyalty_fee ?? undefined,
    loyalty_compensation: item.loyalty_compensation ?? undefined,
    commission: item.commission ?? undefined,
    other_adjustments: item.other_adjustments ?? undefined,
    total_expenses: item.total_expenses ?? undefined,
    operating_profit: item.operating_profit ?? undefined,
    operating_margin_pct: item.operating_margin_pct,
    skus_with_expenses_only: item.skus_with_expenses_only,
    // FR-2..FR-5 competitor-parity pass-through (preserve null, never ?? 0)
    advertising_cost: item.advertising_cost ?? null,
    drr_pct: item.drr_pct ?? null,
    tax_allocated: item.tax_allocated ?? null,
    net_profit_after_tax: item.net_profit_after_tax ?? null,
    net_margin_after_tax_pct: item.net_margin_after_tax_pct ?? null,
    spp_rub: item.spp_rub ?? null,
    spp_pct: item.spp_pct ?? null,
    cancellations_qty: item.cancellations_qty ?? null,
    stock_fbs: item.stock_fbs ?? null,
    stock_fbo: item.stock_fbo ?? null,
    stock_total: item.stock_total ?? null,
    stock_value_rub: item.stock_value_rub ?? null,
    stock_value_share_pct: item.stock_value_share_pct ?? null,
  }
}
