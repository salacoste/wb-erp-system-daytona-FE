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
import { useDashboardPeriod } from '@/hooks/useDashboardPeriod'
import { dashboardQueryKeys } from '@/hooks/useDashboard'
import {
  type DashboardMetricsWithComparison,
  fetchDashboardMetrics,
  fetchMonthlyMetrics,
  CURRENT_PERIOD_STALE_TIME,
  CURRENT_PERIOD_GC_TIME,
  PREVIOUS_PERIOD_STALE_TIME,
  PREVIOUS_PERIOD_GC_TIME,
} from './useDashboardMetricsWithPeriod-utils'

// Re-export types for consumers
export type { DashboardMetricsWithComparison } from './useDashboardMetricsWithPeriod-utils'

/**
 * Hook for parallel fetching of current + previous periods
 * Uses DashboardPeriodContext for selected week/month values.
 */
export function useDashboardMetricsWithComparison(): DashboardMetricsWithComparison {
  const { periodType, selectedWeek, selectedMonth, previousWeek, previousMonth } =
    useDashboardPeriod()

  const currentPeriod = periodType === 'week' ? selectedWeek : selectedMonth
  const previousPeriod = periodType === 'week' ? previousWeek : previousMonth

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
        staleTime: CURRENT_PERIOD_STALE_TIME,
        gcTime: CURRENT_PERIOD_GC_TIME,
        retry: 1,
      },
      {
        queryKey: [...dashboardQueryKeys.metrics(previousPeriod), periodType],
        queryFn: fetchPrevious,
        staleTime: PREVIOUS_PERIOD_STALE_TIME,
        gcTime: PREVIOUS_PERIOD_GC_TIME,
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
        staleTime: CURRENT_PERIOD_STALE_TIME,
        gcTime: CURRENT_PERIOD_GC_TIME,
        retry: 1,
      },
      {
        queryKey: dashboardQueryKeys.metrics(previousWeek),
        queryFn: () => fetchDashboardMetrics(previousWeek),
        staleTime: PREVIOUS_PERIOD_STALE_TIME,
        gcTime: PREVIOUS_PERIOD_GC_TIME,
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
