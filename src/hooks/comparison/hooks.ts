/**
 * Analytics Comparison Hooks
 * Story 61.5-FE: Comparison Endpoint Integration
 *
 * React Query hooks for period comparison analytics.
 */

import { useQuery } from '@tanstack/react-query'
import {
  getAnalyticsComparison,
  deltaToComparison,
  comparisonQueryKeys,
} from '@/lib/api/analytics-comparison'
import { getPreviousIsoWeek, isValidIsoWeekFormat } from '@/lib/iso-week-utils'
import type {
  DashboardMetricsComparison,
  ExpenseMetricsComparison,
} from '@/types/analytics-comparison'
import type { UseComparisonOptions, UseDashboardComparisonResult } from './types'

/**
 * Hook to fetch period comparison analytics
 *
 * @param options - Comparison parameters and query options
 * @returns TanStack Query result with comparison data
 */
export function useAnalyticsComparison(options: UseComparisonOptions) {
  const { period1, period2, groupBy, enabled = true } = options

  const isValidPeriod1 = period1?.includes('-W')
  const isValidPeriod2 = period2?.includes('-W')

  return useQuery({
    queryKey: groupBy
      ? comparisonQueryKeys.withGroupBy(period1, period2, groupBy)
      : comparisonQueryKeys.periods(period1, period2),
    queryFn: () => getAnalyticsComparison({ period1, period2, groupBy }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: enabled && !!period1 && !!period2 && isValidPeriod1 && isValidPeriod2,
    retry: 1,
  })
}

/**
 * Hook for dashboard metrics with automatic comparison to previous period
 * Single API call replaces the previous 2-call pattern
 *
 * @param currentWeek - Current week in ISO format (e.g., "2026-W05")
 * @returns Dashboard and expense metrics with comparison data
 */
export function useDashboardComparison(currentWeek: string): UseDashboardComparisonResult {
  const previousWeek = isValidIsoWeekFormat(currentWeek) ? getPreviousIsoWeek(currentWeek) : ''

  const { data, isLoading, error } = useAnalyticsComparison({
    period1: currentWeek,
    period2: previousWeek,
    enabled: isValidIsoWeekFormat(currentWeek),
  })

  const metrics: DashboardMetricsComparison | null = data
    ? {
        revenue: deltaToComparison(data.period1.revenue, data.period2.revenue, data.delta.revenue),
        profit: deltaToComparison(data.period1.profit, data.period2.profit, data.delta.profit),
        margin: deltaToComparison(
          data.period1.margin_pct,
          data.period2.margin_pct,
          data.delta.margin_pct
        ),
        orders: deltaToComparison(data.period1.orders, data.period2.orders, data.delta.orders),
      }
    : null

  const expenses: ExpenseMetricsComparison | null = data
    ? {
        cogs: deltaToComparison(data.period1.cogs, data.period2.cogs, data.delta.cogs),
        logistics: deltaToComparison(
          data.period1.logistics,
          data.period2.logistics,
          data.delta.logistics
        ),
        storage: deltaToComparison(data.period1.storage, data.period2.storage, data.delta.storage),
        advertising: deltaToComparison(
          data.period1.advertising,
          data.period2.advertising,
          data.delta.advertising
        ),
      }
    : null

  return {
    metrics,
    expenses,
    isLoading,
    error: error as Error | null,
    raw: data,
  }
}

/**
 * Hook for comparing multiple weeks (MoM, QoQ style)
 * Accepts pre-calculated period ranges
 *
 * @param period1 - First period (current) as ISO week or range
 * @param period2 - Second period (comparison) as ISO week or range
 * @param groupBy - Optional breakdown by sku/brand/category
 * @returns Comparison data with optional breakdown
 */
export function useRangeComparison(
  period1: string,
  period2: string,
  groupBy?: 'sku' | 'brand' | 'category'
) {
  return useAnalyticsComparison({
    period1,
    period2,
    groupBy,
    enabled: !!period1 && !!period2,
  })
}
