/**
 * Dashboard Metrics with Period Comparison Hook
 * Story 60.4-FE: Connect Dashboard to Period State
 * Bug Fix 2: Support both week and month periods for data fetching
 *
 * Provides parallel fetching of current and previous period data
 * for comparison indicators in MetricCardEnhanced components.
 * Supports both weekly and monthly periods with proper data aggregation.
 *
 * @see docs/stories/epic-60/story-60.4-fe-connect-dashboard-period.md
 */

'use client'

import { useQueries } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useDashboardPeriod } from '@/hooks/useDashboardPeriod'
import { dashboardQueryKeys, type DashboardMetrics } from '@/hooks/useDashboard'
import type { FinanceSummary } from '@/types/finance-summary'
import { getWeeksInMonth } from '@/lib/period-helpers'
import { getLastCompletedWeek } from '@/lib/margin-helpers'

export interface DashboardMetricsWithComparison {
  current: DashboardMetrics | undefined
  previous: DashboardMetrics | undefined
  isLoading: boolean
  isLoadingCurrent: boolean
  isLoadingPrevious: boolean
  isFetching: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

/** Fetch finance summary for a specific week and transform to DashboardMetrics */
async function fetchDashboardMetrics(week: string): Promise<DashboardMetrics> {
  const summaryResponse = await apiClient.get<{
    summary_total: FinanceSummary | null
    summary_rus: FinanceSummary | null
    summary_eaeu: FinanceSummary | null
    meta: { week: string; cabinet_id: string; generated_at: string; timezone: string }
  }>(`/v1/analytics/weekly/finance-summary?week=${week}`)

  const summary = summaryResponse.summary_total || summaryResponse.summary_rus
  if (!summary) {
    return {}
  }

  return {
    totalPayable: summary.to_pay_goods_total ?? summary.to_pay_goods,
    revenue: summary.sale_gross_total ?? summary.sale_gross,
    grossProfit: summary.gross_profit ?? undefined,
  }
}

/**
 * Fetch and aggregate finance summaries for all weeks in a month
 * Used when periodType is 'month' to aggregate weekly data into monthly metrics
 */
async function fetchMonthlyMetrics(month: string): Promise<DashboardMetrics> {
  try {
    // BUG FIX: Filter out weeks that are after the last completed week
    // to avoid 404 errors for incomplete weeks (e.g., current week has no data yet)
    const allWeeksInMonth = getWeeksInMonth(month)
    const lastCompletedWeek = getLastCompletedWeek()
    const weeksInMonth = allWeeksInMonth.filter(week => week <= lastCompletedWeek)

    if (weeksInMonth.length === 0) {
      return {}
    }

    // Fetch all weeks in parallel (only completed weeks)
    const weeklyPromises = weeksInMonth.map(week => fetchDashboardMetrics(week))
    const weeklyResults = await Promise.allSettled(weeklyPromises)

    // Aggregate successful results
    let aggregatedTotalPayable = 0
    let aggregatedRevenue = 0
    let aggregatedGrossProfit = 0

    weeklyResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        aggregatedTotalPayable += result.value.totalPayable ?? 0
        aggregatedRevenue += result.value.revenue ?? 0
        aggregatedGrossProfit += result.value.grossProfit ?? 0
      }
    })

    return {
      totalPayable: aggregatedTotalPayable || undefined,
      revenue: aggregatedRevenue || undefined,
      grossProfit: aggregatedGrossProfit || undefined,
    }
  } catch (error) {
    console.error('Error fetching monthly metrics:', error)
    return {}
  }
}

/**
 * Hook for parallel fetching of current + previous periods
 * Used when comparison indicators are needed on dashboard
 *
 * Uses DashboardPeriodContext for selected week/month values.
 * Supports both weekly and monthly periods with proper cache isolation.
 * Fetches both periods in parallel using useQueries for optimal performance.
 */
export function useDashboardMetricsWithComparison(): DashboardMetricsWithComparison {
  const { periodType, selectedWeek, selectedMonth, previousWeek, previousMonth } =
    useDashboardPeriod()

  // Determine which period identifier to use based on periodType
  const currentPeriod = periodType === 'week' ? selectedWeek : selectedMonth
  const previousPeriod = periodType === 'week' ? previousWeek : previousMonth

  // Select the appropriate fetch function based on period type
  const fetchCurrent =
    periodType === 'week'
      ? () => fetchDashboardMetrics(selectedWeek)
      : () => fetchMonthlyMetrics(selectedMonth)

  const fetchPrevious =
    periodType === 'week'
      ? () => fetchDashboardMetrics(previousWeek)
      : () => fetchMonthlyMetrics(previousMonth)

  const results = useQueries({
    queries: [
      {
        queryKey: [...dashboardQueryKeys.metrics(currentPeriod), periodType],
        queryFn: fetchCurrent,
        staleTime: 60 * 1000, // 1 min for current period (fresh data)
        gcTime: 5 * 60 * 1000, // 5 min garbage collection
        retry: 1,
      },
      {
        queryKey: [...dashboardQueryKeys.metrics(previousPeriod), periodType],
        queryFn: fetchPrevious,
        staleTime: 5 * 60 * 1000, // 5 min for previous period (historical data)
        gcTime: 10 * 60 * 1000, // 10 min garbage collection
        retry: 1,
      },
    ],
  })

  const [currentResult, previousResult] = results

  return {
    current: currentResult.data,
    previous: previousResult.data,
    isLoading: currentResult.isLoading || previousResult.isLoading,
    isLoadingCurrent: currentResult.isLoading,
    isLoadingPrevious: previousResult.isLoading,
    isFetching: currentResult.isFetching || previousResult.isFetching,
    isError: currentResult.isError || previousResult.isError,
    error: currentResult.error ?? previousResult.error ?? null,
    refetch: () => {
      currentResult.refetch()
      previousResult.refetch()
    },
  }
}

/**
 * Standalone hook for comparison fetching with explicit week parameters
 * Useful when not using DashboardPeriodContext
 */
export function useDashboardMetricsComparison(
  currentWeek: string,
  previousWeek: string
): DashboardMetricsWithComparison {
  const results = useQueries({
    queries: [
      {
        queryKey: dashboardQueryKeys.metrics(currentWeek),
        queryFn: () => fetchDashboardMetrics(currentWeek),
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
      },
      {
        queryKey: dashboardQueryKeys.metrics(previousWeek),
        queryFn: () => fetchDashboardMetrics(previousWeek),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
      },
    ],
  })

  const [currentResult, previousResult] = results

  return {
    current: currentResult.data,
    previous: previousResult.data,
    isLoading: currentResult.isLoading || previousResult.isLoading,
    isLoadingCurrent: currentResult.isLoading,
    isLoadingPrevious: previousResult.isLoading,
    isFetching: currentResult.isFetching || previousResult.isFetching,
    isError: currentResult.isError || previousResult.isError,
    error: currentResult.error ?? previousResult.error ?? null,
    refetch: () => {
      currentResult.refetch()
      previousResult.refetch()
    },
  }
}
