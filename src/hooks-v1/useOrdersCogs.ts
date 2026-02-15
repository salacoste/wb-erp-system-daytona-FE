/**
 * React Query Hook for Orders with COGS
 * Story 61.4-FE: COGS for Orders Integration
 * Epic 61-FE: Dashboard Data Integration
 *
 * Hook for fetching orders volume enriched with COGS data.
 *
 * @see docs/stories/epic-61/story-61.4-fe-orders-cogs.md
 */

import { useQuery } from '@tanstack/react-query'
import { getISOWeek, getISOWeekYear, subMonths, format } from 'date-fns'
import { apiClient } from '@/lib/api-client'
import { weekToDateRange, monthToDateRange } from '@/lib/date-utils'
import type {
  OrdersVolumeWithCogsResponse,
  OrdersCogsMetrics,
  OrdersCogsParams,
} from '@/types/orders-cogs'
import type { OrderStatusBreakdown } from '@/types/orders-volume'

// =============================================================================
// Query Keys Factory
// =============================================================================

/**
 * Query keys factory for orders COGS data
 */
export const ordersCogsQueryKeys = {
  all: ['orders-cogs'] as const,

  byRange: (from: string, to: string) => [...ordersCogsQueryKeys.all, from, to] as const,

  byRangeWithOptions: (from: string, to: string, aggregation: string, includeCogs: boolean) =>
    [...ordersCogsQueryKeys.byRange(from, to), aggregation, includeCogs] as const,
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Map backend camelCase response to frontend snake_case types.
 * Backend returns camelCase fields (totalOrders, statusBreakdown[]),
 * but frontend types use snake_case (total_orders, by_status{}).
 */
function mapBackendResponse(raw: Record<string, unknown>): OrdersVolumeWithCogsResponse {
  // Map statusBreakdown array → by_status object
  const statusArray = (raw.statusBreakdown as Array<{ status: string; count: number }>) ?? []
  const byStatus: OrderStatusBreakdown = { new: 0, confirm: 0, complete: 0, cancel: 0 }
  for (const item of statusArray) {
    if (item.status in byStatus) {
      byStatus[item.status as keyof OrderStatusBreakdown] = item.count
    }
  }

  // Map by_day_with_cogs fields (backend: count/cogs → frontend: orders/cogs_total)
  const rawDaily = (raw.by_day_with_cogs as Array<Record<string, unknown>>) ?? []
  const byDayWithCogs = rawDaily.map(d => ({
    date: d.date as string,
    orders: (d.count as number) ?? 0,
    amount: (d.amount as number) ?? 0,
    cogs_total: (d.cogs as number) ?? 0,
    profit: (d.profit as number) ?? 0,
    margin_pct: (d.margin_pct as number) ?? undefined,
  }))

  return {
    total_orders: (raw.totalOrders as number) ?? 0,
    total_amount:
      (raw.total_amount as number) ??
      ((raw.gross_profit as number) ?? 0) + ((raw.cogs_total as number) ?? 0),
    avg_order_value: (raw.avgOrderValue as number) ?? 0,
    by_status: byStatus,
    cogs_total: (raw.cogs_total as number) ?? undefined,
    avg_cogs_per_order: (raw.avg_cogs_per_order as number) ?? undefined,
    gross_profit: (raw.gross_profit as number) ?? undefined,
    margin_pct: (raw.margin_pct as number) ?? undefined,
    orders_with_cogs: (raw.orders_with_cogs as number) ?? undefined,
    cogs_coverage_pct: (raw.cogs_coverage_pct as number) ?? undefined,
    by_day_with_cogs: byDayWithCogs.length > 0 ? byDayWithCogs : undefined,
  }
}

/**
 * Fetch orders volume with COGS data
 * Uses include_cogs=true to get COGS enrichment from backend (Request #138)
 *
 * @param params - Query parameters
 * @returns Orders volume with COGS fields (normalized to frontend types)
 */
async function getOrdersWithCogs(params: OrdersCogsParams): Promise<OrdersVolumeWithCogsResponse> {
  const searchParams = new URLSearchParams({
    from: params.from,
    to: params.to,
  })

  if (params.aggregation) {
    searchParams.set('aggregation', params.aggregation)
  }

  if (params.include_cogs) {
    searchParams.set('include_cogs', 'true')
  }

  console.info('[Orders COGS] Fetching orders with COGS:', params)

  const raw = await apiClient.get<Record<string, unknown>>(
    `/v1/analytics/orders/volume?${searchParams.toString()}`,
    { skipDataUnwrap: true }
  )

  return mapBackendResponse(raw)
}

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Transform API response to dashboard-friendly COGS metrics
 *
 * @param response - Raw API response with COGS data
 * @returns Transformed metrics for dashboard display
 */
function transformToCogsMetrics(response: OrdersVolumeWithCogsResponse): OrdersCogsMetrics {
  const total = response.total_orders || 1
  const cogsTotal = response.cogs_total || 0
  const ordersWithCogs = response.orders_with_cogs || 0
  const grossProfit = response.gross_profit ?? response.total_amount - cogsTotal

  // Defensive: handle missing by_status (API may not always return it)
  const byStatus = response.by_status ?? { new: 0, confirm: 0, complete: 0, cancel: 0 }

  return {
    totalOrders: response.total_orders,
    totalAmount: response.total_amount,
    cogsTotal,
    grossProfit,
    marginPct:
      response.margin_pct ??
      (response.total_amount > 0
        ? ((response.total_amount - cogsTotal) / response.total_amount) * 100
        : 0),
    cogsCoveragePct: response.cogs_coverage_pct ?? (ordersWithCogs / total) * 100,
    ordersMissingCogs: response.total_orders - ordersWithCogs,
    avgProfitPerOrder: total > 0 ? grossProfit / total : 0,
    completionRate: (byStatus.complete / total) * 100,
    cancellationRate: (byStatus.cancel / total) * 100,
    byStatus,
    dailyBreakdown: response.by_day_with_cogs,
  }
}

// =============================================================================
// Hook Options
// =============================================================================

export interface UseOrdersCogsOptions {
  /** Period type: 'week' or 'month' */
  periodType: 'week' | 'month'
  /** ISO week (YYYY-Www) or month (YYYY-MM) */
  period: string
  /** Include daily breakdown */
  withDailyBreakdown?: boolean
  /** Enable/disable query */
  enabled?: boolean
}

// =============================================================================
// Main Hook
// =============================================================================

/**
 * Hook to fetch orders with COGS data for margin analysis
 *
 * @example
 * const { data, isLoading } = useOrdersCogs({
 *   periodType: 'week',
 *   period: '2026-W05',
 *   withDailyBreakdown: true,
 * })
 *
 * // Access margin data
 * console.log(data?.marginPct, data?.grossProfit)
 */
export function useOrdersCogs(options: UseOrdersCogsOptions) {
  const { periodType, period, withDailyBreakdown = false, enabled = true } = options

  // Check if query should be enabled
  const isEnabled = enabled && !!period

  // Convert period to date range (only if enabled to avoid throwing on empty period)
  const dateRange =
    isEnabled && period
      ? periodType === 'week'
        ? weekToDateRange(period)
        : monthToDateRange(period)
      : { from: '', to: '' }

  const params: OrdersCogsParams = {
    from: dateRange.from,
    to: dateRange.to,
    aggregation: withDailyBreakdown ? 'day' : undefined,
    include_cogs: true,
  }

  return useQuery<OrdersCogsMetrics, Error>({
    queryKey: ordersCogsQueryKeys.byRangeWithOptions(
      params.from || 'disabled',
      params.to || 'disabled',
      params.aggregation || 'total',
      true
    ),
    queryFn: async () => {
      const response = await getOrdersWithCogs(params)
      return transformToCogsMetrics(response)
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Note: retry controlled by QueryClient (default: 3 in prod, 0 in tests)
  })
}

// =============================================================================
// Comparison Hook
// =============================================================================

/**
 * Hook to fetch orders COGS with comparison to previous period
 * Story 61.11-FE: Previous Period Data Integration
 *
 * @example
 * const { current, previous, isLoading } = useOrdersCogsWithComparison({
 *   periodType: 'week',
 *   period: '2026-W05',
 * })
 */
export function useOrdersCogsWithComparison(options: UseOrdersCogsOptions) {
  const { enabled = true } = options

  // Calculate previous period (handle empty period gracefully)
  const previousPeriod = options.period
    ? options.periodType === 'week'
      ? getPreviousWeek(options.period)
      : getPreviousMonth(options.period)
    : ''

  const currentQuery = useOrdersCogs(options)

  const previousQuery = useOrdersCogs({
    ...options,
    period: previousPeriod,
    enabled: enabled && !!previousPeriod,
  })

  // Handle previous period errors gracefully - return undefined instead of error
  const previousData = previousQuery.isError ? undefined : previousQuery.data

  // Determine combined loading state
  const isLoading = currentQuery.isLoading || (previousQuery.isLoading && !previousQuery.isError)

  // Current period error is critical, previous period error is graceful
  const isError = currentQuery.isError
  const error = currentQuery.error

  return {
    current: currentQuery.data,
    previous: previousData,
    isLoading,
    isError,
    error,
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get previous ISO week string
 * Handles year boundary: "2026-W01" -> "2025-W52"
 *
 * @param week - ISO week string (YYYY-Www)
 * @returns Previous week in ISO format
 */
function getPreviousWeek(week: string): string {
  const match = week.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return week

  const [, yearStr, weekStr] = match
  const year = parseInt(yearStr, 10)
  const weekNum = parseInt(weekStr, 10)

  // If week number is 1, we need to go to previous year's last week
  if (weekNum === 1) {
    // Go to last week of previous year
    const lastYearDec = new Date(year - 1, 11, 28) // Dec 28 is always in last week
    const lastWeek = getISOWeek(lastYearDec)
    const lastWeekYear = getISOWeekYear(lastYearDec)
    return `${lastWeekYear}-W${lastWeek.toString().padStart(2, '0')}`
  }

  // Simple case: just decrement week number
  return `${year}-W${(weekNum - 1).toString().padStart(2, '0')}`
}

/**
 * Get previous month string
 * Handles year boundary: "2026-01" -> "2025-12"
 *
 * @param month - Month string (YYYY-MM)
 * @returns Previous month in YYYY-MM format
 */
function getPreviousMonth(month: string): string {
  const match = month.match(/^(\d{4})-(\d{2})$/)
  if (!match) return month

  const [, yearStr, monthStr] = match
  const year = parseInt(yearStr, 10)
  const monthNum = parseInt(monthStr, 10)

  // Create a date and subtract 1 month
  const date = new Date(year, monthNum - 1, 1)
  const prevDate = subMonths(date, 1)

  return format(prevDate, 'yyyy-MM')
}
