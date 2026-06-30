'use client'

import { logger } from '@/lib/logger'

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
  type RawMarginAnalyticsResponse,
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
      'by-category',
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

        logger.debug('[Margin Analytics] Fetching category analytics:', {
          week: isRangeQuery ? `${weekStart} — ${weekEnd}` : week,
          isRangeQuery,
          isComparisonMode,
          includeCogs,
          includeAds,
          includeStock,
        })

        const response = await apiClient.get<unknown[] | RawMarginAnalyticsResponse>(
          `/v1/analytics/weekly/by-category?${params.toString()}`
        )

        const { items, meta } = extractItems(response)

        // Transform response — Epic 26: operating expenses, Request #69: revenue_gross
        const transformed: MarginAnalyticsAggregatedResponse = {
          data: items.map(item => mapCategoryItem(item)),
          meta: meta as MarginAnalyticsAggregatedResponse['meta'],
        }

        logger.debug('[Margin Analytics] Category analytics received:', {
          count: transformed.data.length,
          hasOperatingMargin: transformed.data.some(d => d.operating_margin_pct != null),
        })

        return transformed
      } catch (error) {
        logger.error('[Margin Analytics] Failed to fetch category analytics:', error)
        throw error
      }
    },
    ...MARGIN_ANALYTICS_QUERY_CONFIG,
    enabled: !!(week || (weekStart && weekEnd)),
  })
}

/** Raw backend item shape for margin analytics by category (string-prefixed _rub fields) */
interface RawCategoryItem {
  subject_name: string
  revenue_gross_rub?: string
  revenue_net_rub?: string
  total_units: number
  sku_count: number
  cogs_rub?: string
  profit_rub?: string
  margin_pct?: number
  markup_percent?: number
  missing_cogs_count?: number
  storage_cost_rub?: string
  penalties_rub?: string
  paid_acceptance_cost_rub?: string
  acquiring_fee_rub?: string
  loyalty_fee_rub?: string
  loyalty_compensation_rub?: string
  commission_rub?: string
  other_adjustments_rub?: string
  total_expenses_rub?: string
  operating_profit_rub?: string
  operating_margin_pct?: number | null
  skus_with_expenses_only?: number
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

/** Map a single category API item to the frontend response shape */
function mapCategoryItem(raw: unknown) {
  const item = raw as RawCategoryItem
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
    // FR-2..FR-5 competitor-parity pass-through (numeric number|null in DTO; preserve null)
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
