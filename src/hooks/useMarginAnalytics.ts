/**
 * Hooks for margin analytics (SKU, Brand, Category)
 * Story 4.5: Margin Analysis by SKU
 * Story 4.6: Margin Analysis by Brand & Category
 * Story 6.1-FE: Date Range Support for Analytics
 * Epic 17 Backend API Integration
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type {
  MarginAnalyticsSkuResponse,
  MarginAnalyticsAggregatedResponse,
} from '@/types/api'

/**
 * Filters for margin analytics hooks
 * Story 6.1-FE: Added weekStart/weekEnd for date range support
 * Story 6.2-FE: Added compareTo for period comparison
 */
export interface MarginAnalyticsFilters {
  week?: string             // Single week (backward compatible, e.g., "2025-W47")
  weekStart?: string        // Story 6.1-FE: Range start (ISO week)
  weekEnd?: string          // Story 6.1-FE: Range end (ISO week)
  compareTo?: string        // Story 6.2-FE: Comparison period (ISO week, e.g., "2025-W43")
  compareToStart?: string   // Story 6.2-FE: Comparison range start
  compareToEnd?: string     // Story 6.2-FE: Comparison range end
  includeCogs?: boolean     // Default: true (maps to include_cogs in API)
  cursor?: string           // Pagination cursor
  limit?: number            // Items per page (default: 50)
  nmId?: string             // Story 4.9: nm_id for CLIENT-SIDE filtering only
                            // Note: /by-sku endpoint does NOT support nm_id param
                            // Data is filtered after fetch, not in API call
}

export type SortField = 'margin_pct' | 'revenue_net' | 'sa_name' | 'profit'
export type SortOrder = 'asc' | 'desc'

/**
 * Hook to fetch margin analytics by SKU
 * Story 6.1-FE: Supports weekStart/weekEnd for date range queries
 *
 * @example
 * // Single week (backward compatible)
 * const { data, isLoading } = useMarginAnalyticsBySku({
 *   week: '2025-W47',
 *   includeCogs: true
 * });
 *
 * // Date range (Story 6.1-FE)
 * const { data, isLoading } = useMarginAnalyticsBySku({
 *   weekStart: '2025-W44',
 *   weekEnd: '2025-W47',
 *   includeCogs: true
 * });
 *
 * @returns Query result with margin data for each SKU
 */
export function useMarginAnalyticsBySku(filters: MarginAnalyticsFilters) {
  const { week, weekStart, weekEnd, compareTo, compareToStart, compareToEnd, includeCogs = true, cursor, limit = 50, nmId } = filters

  // Story 6.1-FE: Determine if using date range or single week
  const isRangeQuery = weekStart && weekEnd
  const effectiveWeek = week || weekStart || '' // For backward compatibility

  // Story 6.2-FE: Determine if comparison mode is active
  const isComparisonMode = !!(compareTo || (compareToStart && compareToEnd))

  return useQuery({
    // Story 4.9: Include nmId in query key for proper cache invalidation on filter change
    // Story 6.1-FE: Include weekStart/weekEnd for date range cache isolation
    // Story 6.2-FE: Include compareTo for comparison cache isolation
    queryKey: ['analytics', 'margin', 'by-sku', { week: effectiveWeek, weekStart, weekEnd, compareTo, compareToStart, compareToEnd, includeCogs, cursor, limit, nmId }],
    queryFn: async (): Promise<MarginAnalyticsSkuResponse> => {
      try {
        // Build query parameters
        // Note: Backend uses snake_case (include_cogs), frontend interface uses camelCase
        const params = new URLSearchParams()

        // Story 6.1-FE: Use weekStart/weekEnd if provided, otherwise use single week
        if (isRangeQuery) {
          params.append('weekStart', weekStart)
          params.append('weekEnd', weekEnd)
        } else if (week) {
          params.append('week', week)
        }

        params.append('include_cogs', String(includeCogs))

        if (cursor) {
          params.append('cursor', cursor)
        }

        if (limit !== 50) {
          params.append('limit', String(limit))
        }

        // Note: nm_id filtering is NOT supported by /by-sku endpoint
        // Filtering is done client-side after fetch (see below)

        // Story 6.2-FE: Add compare_to parameter for period comparison
        if (compareTo) {
          params.append('compare_to', compareTo)
        } else if (compareToStart && compareToEnd) {
          params.append('compare_to_start', compareToStart)
          params.append('compare_to_end', compareToEnd)
        }

        console.info('[Margin Analytics] Fetching SKU analytics:', {
          week: isRangeQuery ? `${weekStart} — ${weekEnd}` : week,
          isRangeQuery,
          isComparisonMode,
          includeCogs,
          cursor,
          limit,
          nmId: nmId ?? 'all',
        })

        // Call backend API
        // Endpoint: GET /v1/analytics/weekly/by-sku?week=YYYY-Www&include_cogs=true
        // Note: apiClient unwraps { data: [...] } to just [...], so response may be array directly
        const response = await apiClient.get<any[] | { items?: any[]; data?: any[]; meta?: any }>(
          `/v1/analytics/weekly/by-sku?${params.toString()}`
        )

        // Handle different response structures:
        // 1. Array directly (apiClient unwrapped data)
        // 2. Object with items array
        // 3. Object with data array
        const items = Array.isArray(response)
          ? response
          : (response.items ?? response.data ?? [])

        // Transform response to match expected format
        // Request #60: Include operational costs per SKU
        let transformedData = items.map((item: any) => ({
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
          paid_acceptance_cost_rub: item.paid_acceptance_cost ? String(item.paid_acceptance_cost) : undefined,
          // Placeholder for future advertising costs
          advertising_cost_rub: item.advertising_cost ? String(item.advertising_cost) : undefined,
          // Epic 30: Calculated totals from backend (field names without _rub suffix)
          total_expenses_rub: item.total_expenses ? String(item.total_expenses) : undefined,
          total_expenses: item.total_expenses, // Number for filtering
          operating_profit_rub: item.operating_profit ? String(item.operating_profit) : undefined,
          operating_profit: item.operating_profit, // Number for margin calculation
          operating_margin_pct: item.operating_margin_pct,
          has_revenue: item.has_revenue,
          // Epic 30: Net profit fields (after all operational costs)
          net_profit: item.net_profit,
          net_margin_pct: item.net_margin_pct,
          storage_data_source: item.storage_data_source,
        }))

        // Story 4.9: Client-side filtering by nm_id (backend doesn't support this param)
        if (nmId) {
          transformedData = transformedData.filter(
            (item) => String(item.nm_id) === String(nmId)
          )
          console.info('[Margin Analytics] Filtered by nm_id:', { nmId, matchCount: transformedData.length })
        }

        const transformed: MarginAnalyticsSkuResponse = {
          data: transformedData,
          meta: Array.isArray(response) ? undefined : response.meta,
        }

        console.info('[Margin Analytics] SKU analytics received:', {
          count: transformed.data.length,
          has_cogs_data: transformed.data.some((item) => item.cogs !== undefined),
        })

        return transformed
      } catch (error) {
        console.error('[Margin Analytics] Failed to fetch SKU analytics:', error)
        throw error
      }
    },
    staleTime: 30000,  // 30 seconds
    gcTime: 300000,    // 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
    // Story 6.1-FE: Enable query when week or weekStart+weekEnd is provided
    enabled: !!(week || (weekStart && weekEnd)),
  })
}

/**
 * Hook to fetch margin analytics by brand
 * Story 6.1-FE: Supports weekStart/weekEnd for date range queries
 *
 * @example
 * // Single week (backward compatible)
 * const { data, isLoading } = useMarginAnalyticsByBrand({
 *   week: '2025-W47',
 *   includeCogs: true
 * });
 *
 * // Date range (Story 6.1-FE)
 * const { data, isLoading } = useMarginAnalyticsByBrand({
 *   weekStart: '2025-W44',
 *   weekEnd: '2025-W47',
 *   includeCogs: true
 * });
 *
 * @returns Query result with aggregated margin data by brand
 */
export function useMarginAnalyticsByBrand(filters: MarginAnalyticsFilters) {
  const { week, weekStart, weekEnd, compareTo, compareToStart, compareToEnd, includeCogs = true, cursor, limit = 50 } = filters

  // Story 6.1-FE: Determine if using date range or single week
  const isRangeQuery = weekStart && weekEnd
  const effectiveWeek = week || weekStart || ''

  // Story 6.2-FE: Determine if comparison mode is active
  const isComparisonMode = !!(compareTo || (compareToStart && compareToEnd))

  return useQuery({
    // Story 6.1-FE: Include weekStart/weekEnd for date range cache isolation
    // Story 6.2-FE: Include compareTo for comparison cache isolation
    queryKey: ['analytics', 'margin', 'by-brand', { week: effectiveWeek, weekStart, weekEnd, compareTo, compareToStart, compareToEnd, includeCogs, cursor, limit }],
    queryFn: async (): Promise<MarginAnalyticsAggregatedResponse> => {
      try {
        // Build query parameters
        // Note: Backend uses snake_case (include_cogs), frontend interface uses camelCase
        const params = new URLSearchParams()

        // Story 6.1-FE: Use weekStart/weekEnd if provided, otherwise use single week
        if (isRangeQuery) {
          params.append('weekStart', weekStart)
          params.append('weekEnd', weekEnd)
        } else if (week) {
          params.append('week', week)
        }

        params.append('include_cogs', String(includeCogs))

        if (cursor) {
          params.append('cursor', cursor)
        }

        if (limit !== 50) {
          params.append('limit', String(limit))
        }

        // Story 6.2-FE: Add compare_to parameter for period comparison
        if (compareTo) {
          params.append('compare_to', compareTo)
        } else if (compareToStart && compareToEnd) {
          params.append('compare_to_start', compareToStart)
          params.append('compare_to_end', compareToEnd)
        }

        console.info('[Margin Analytics] Fetching brand analytics:', {
          week: isRangeQuery ? `${weekStart} — ${weekEnd}` : week,
          isRangeQuery,
          isComparisonMode,
          includeCogs,
        })

        // Call backend API
        // Endpoint: GET /v1/analytics/weekly/by-brand?week=YYYY-Www&include_cogs=true
        // Note: apiClient unwraps { data: [...] } to just [...], so response may be array directly
        const response = await apiClient.get<any[] | { items?: any[]; data?: any[]; meta?: any }>(
          `/v1/analytics/weekly/by-brand?${params.toString()}`
        )

        // Handle different response structures
        const items = Array.isArray(response)
          ? response
          : (response.items ?? response.data ?? [])

        // Transform response to match expected format
        // Epic 26: Include operating expenses and operating profit for consistency with SKU page
        // Request #69: Include revenue_gross for UI consistency with SKU page
        // Note: Brand API returns revenue_gross as number (not string like Category API)
        const transformed: MarginAnalyticsAggregatedResponse = {
          data: items.map((item: any) => ({
            brand: item.brand,
            revenue_gross: item.revenue_gross, // Request #69: already a number from Brand API
            revenue_net: item.revenue_net,
            qty: item.total_units,
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
          })),
          meta: Array.isArray(response) ? undefined : response.meta,
        }

        console.info('[Margin Analytics] Brand analytics received:', {
          count: transformed.data.length,
          hasOperatingMargin: transformed.data.some(d => d.operating_margin_pct != null),
        })

        return transformed
      } catch (error) {
        console.error('[Margin Analytics] Failed to fetch brand analytics:', error)
        throw error
      }
    },
    staleTime: 30000,  // 30 seconds
    gcTime: 300000,    // 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
    // Story 6.1-FE: Enable query when week or weekStart+weekEnd is provided
    enabled: !!(week || (weekStart && weekEnd)),
  })
}

/**
 * Hook to fetch margin analytics by category
 * Story 6.1-FE: Supports weekStart/weekEnd for date range queries
 *
 * @example
 * // Single week (backward compatible)
 * const { data, isLoading } = useMarginAnalyticsByCategory({
 *   week: '2025-W47',
 *   includeCogs: true
 * });
 *
 * // Date range (Story 6.1-FE)
 * const { data, isLoading } = useMarginAnalyticsByCategory({
 *   weekStart: '2025-W44',
 *   weekEnd: '2025-W47',
 *   includeCogs: true
 * });
 *
 * @returns Query result with aggregated margin data by category
 */
export function useMarginAnalyticsByCategory(filters: MarginAnalyticsFilters) {
  const { week, weekStart, weekEnd, compareTo, compareToStart, compareToEnd, includeCogs = true, cursor, limit = 50 } = filters

  // Story 6.1-FE: Determine if using date range or single week
  const isRangeQuery = weekStart && weekEnd
  const effectiveWeek = week || weekStart || ''

  // Story 6.2-FE: Determine if comparison mode is active
  const isComparisonMode = !!(compareTo || (compareToStart && compareToEnd))

  return useQuery({
    // Story 6.1-FE: Include weekStart/weekEnd for date range cache isolation
    // Story 6.2-FE: Include compareTo for comparison cache isolation
    queryKey: ['analytics', 'margin', 'by-category', { week: effectiveWeek, weekStart, weekEnd, compareTo, compareToStart, compareToEnd, includeCogs, cursor, limit }],
    queryFn: async (): Promise<MarginAnalyticsAggregatedResponse> => {
      try {
        // Build query parameters
        // Note: Backend uses snake_case (include_cogs), frontend interface uses camelCase
        const params = new URLSearchParams()

        // Story 6.1-FE: Use weekStart/weekEnd if provided, otherwise use single week
        if (isRangeQuery) {
          params.append('weekStart', weekStart)
          params.append('weekEnd', weekEnd)
        } else if (week) {
          params.append('week', week)
        }

        params.append('include_cogs', String(includeCogs))

        if (cursor) {
          params.append('cursor', cursor)
        }

        if (limit !== 50) {
          params.append('limit', String(limit))
        }

        // Story 6.2-FE: Add compare_to parameter for period comparison
        if (compareTo) {
          params.append('compare_to', compareTo)
        } else if (compareToStart && compareToEnd) {
          params.append('compare_to_start', compareToStart)
          params.append('compare_to_end', compareToEnd)
        }

        console.info('[Margin Analytics] Fetching category analytics:', {
          week: isRangeQuery ? `${weekStart} — ${weekEnd}` : week,
          isRangeQuery,
          isComparisonMode,
          includeCogs,
        })

        // Call backend API
        // Endpoint: GET /v1/analytics/weekly/by-category?week=YYYY-Www&include_cogs=true
        // Note: apiClient unwraps { data: [...] } to just [...], so response may be array directly
        const response = await apiClient.get<any[] | { items?: any[]; data?: any[]; meta?: any }>(
          `/v1/analytics/weekly/by-category?${params.toString()}`
        )

        // Handle different response structures
        const items = Array.isArray(response)
          ? response
          : (response.items ?? response.data ?? [])

        // Transform response to match expected format
        // Epic 26: Include operating expenses and operating profit for consistency with SKU page
        // Request #69: Include revenue_gross for UI consistency with SKU page
        const transformed: MarginAnalyticsAggregatedResponse = {
          data: items.map((item: any) => ({
            category: item.subject_name,
            revenue_gross: item.revenue_gross_rub ? parseFloat(item.revenue_gross_rub) : undefined, // Request #69
            revenue_net: parseFloat(item.revenue_net_rub || '0'),
            qty: item.sku_count,
            cogs: item.cogs_rub ? parseFloat(item.cogs_rub) : undefined,
            profit: item.profit_rub ? parseFloat(item.profit_rub) : undefined,
            margin_pct: item.margin_pct,
            markup_percent: item.markup_percent,
            missing_cogs_count: item.missing_cogs_count,
            // Epic 26: Operating expenses and profit
            storage_cost: item.storage_cost_rub ? parseFloat(item.storage_cost_rub) : undefined,
            penalties: item.penalties_rub ? parseFloat(item.penalties_rub) : undefined,
            paid_acceptance_cost: item.paid_acceptance_cost_rub ? parseFloat(item.paid_acceptance_cost_rub) : undefined,
            acquiring_fee: item.acquiring_fee_rub ? parseFloat(item.acquiring_fee_rub) : undefined,
            loyalty_fee: item.loyalty_fee_rub ? parseFloat(item.loyalty_fee_rub) : undefined,
            loyalty_compensation: item.loyalty_compensation_rub ? parseFloat(item.loyalty_compensation_rub) : undefined,
            commission: item.commission_rub ? parseFloat(item.commission_rub) : undefined,
            other_adjustments: item.other_adjustments_rub ? parseFloat(item.other_adjustments_rub) : undefined,
            total_expenses: item.total_expenses_rub ? parseFloat(item.total_expenses_rub) : undefined,
            operating_profit: item.operating_profit_rub ? parseFloat(item.operating_profit_rub) : undefined,
            operating_margin_pct: item.operating_margin_pct,
            skus_with_expenses_only: item.skus_with_expenses_only,
          })),
          meta: Array.isArray(response) ? undefined : response.meta,
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
    staleTime: 30000,  // 30 seconds
    gcTime: 300000,    // 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
    // Story 6.1-FE: Enable query when week or weekStart+weekEnd is provided
    enabled: !!(week || (weekStart && weekEnd)),
  })
}

/**
 * Helper function to get current ISO week
 *
 * @example
 * const currentWeek = getCurrentIsoWeek(); // "2025-W47"
 */
export function getCurrentIsoWeek(): string {
  const date = new Date()

  // ISO week date calculation
  const target = new Date(date.valueOf())
  const dayNr = (date.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)

  return `${target.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`
}

/**
 * Helper function to format week for display
 *
 * @example
 * formatWeekDisplay('2025-W47'); // "Неделя 47, 2025"
 */
export function formatWeekDisplay(week: string): string {
  const match = week.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return week

  const [, year, weekNum] = match
  return `Неделя ${parseInt(weekNum, 10)}, ${year}`
}

/**
 * Cabinet-level expenses and cashflow response interface
 * Includes full cashflow data + expenses not attributed to specific SKUs (nm_id='UNKNOWN')
 */
export interface CabinetLevelExpenses {
  // Cashflow data (mathematically consistent)
  /** Sales before marketplace commission */
  sales_gross: number
  /** Returns gross (Возвраты) */
  returns_gross: number
  /** Marketplace commission (Комиссия МП) */
  marketplace_commission: number
  /** Acquiring fee (Эквайринг) - for visibility, already included in net_for_pay deduction */
  acquiring_fee: number
  /** Total COGS across all SKUs */
  cogs_total: number
  /** Gross profit from SKUs: to_pay_goods - cogs (FIXED 2025-12-19: was sales_gross - commission - cogs) */
  gross_profit_sku: number
  // Cabinet-level expenses (deducted from payout)
  /** Logistics costs (Стоимость логистики) */
  logistics: number
  /** Storage costs from paid_storage_daily (Хранение - основной источник) */
  storage: number
  /** Request #67: Storage from weekly report (Хранение из еженедельного отчёта - для сравнения) */
  storage_weekly_report: number
  /** Request #67: Difference between storage sources (storage - storage_weekly_report) */
  storage_difference: number
  /** Other adjustments (Прочие удержания) */
  other_adjustments: number
  /** WB commission adjustment (Корректировка ВВ, reason='Удержание') */
  wb_commission_adj: number
  /** Penalties (Штрафы) */
  penalties: number
  /** Paid acceptance costs (Платная приёмка) */
  paid_acceptance: number
  /** Total cabinet-level expenses (including logistics) */
  total: number
  /** Weeks included in the calculation */
  weeks_included: string[]
}

/**
 * Hook to fetch cabinet-level expenses
 * These are expenses that cannot be attributed to specific SKUs (nm_id='UNKNOWN')
 *
 * Endpoint: GET /v1/analytics/cabinet-expenses?weekStart=YYYY-Www&weekEnd=YYYY-Www
 *
 * @example
 * const { data, isLoading } = useCabinetLevelExpenses({
 *   weekStart: '2025-W49',
 *   weekEnd: '2025-W49',
 * });
 *
 * @returns Query result with cabinet-level expenses breakdown
 */
export function useCabinetLevelExpenses(filters: { weekStart?: string; weekEnd?: string }) {
  const { weekStart, weekEnd } = filters

  return useQuery({
    queryKey: ['analytics', 'cabinet-expenses', { weekStart, weekEnd }],
    queryFn: async (): Promise<CabinetLevelExpenses> => {
      try {
        const params = new URLSearchParams()
        if (weekStart) params.append('weekStart', weekStart)
        if (weekEnd) params.append('weekEnd', weekEnd)

        console.info('[Cabinet Expenses] Fetching cabinet-level expenses:', {
          weekStart,
          weekEnd,
        })

        // Response structure: { data: CabinetLevelExpenses }
        // Endpoint is under WeeklyAnalyticsController prefix: v1/analytics/weekly
        const response = await apiClient.get<{ data: CabinetLevelExpenses } | CabinetLevelExpenses>(
          `/v1/analytics/weekly/cabinet-expenses?${params.toString()}`
        )

        // Handle wrapped response
        const expenses = 'data' in response && response.data && typeof response.data === 'object' && 'storage' in response.data
          ? response.data
          : response as CabinetLevelExpenses

        console.info('[Cabinet Expenses] Received:', expenses)

        return expenses
      } catch (error) {
        console.error('[Cabinet Expenses] Failed to fetch:', error)
        throw error
      }
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
    enabled: !!(weekStart && weekEnd),
  })
}
