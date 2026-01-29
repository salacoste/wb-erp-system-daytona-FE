/**
 * Dashboard Metrics with Period Comparison Hook
 * Story 60.4-FE: Connect Dashboard to Period State
 *
 * Provides parallel fetching of current and previous period data
 * for comparison indicators in MetricCardEnhanced components.
 *
 * @see docs/stories/epic-60/story-60.4-fe-connect-dashboard-period.md
 */

'use client'

import { useQueries } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useDashboardPeriod } from '@/hooks/useDashboardPeriod'
import { dashboardQueryKeys, type DashboardMetrics } from '@/hooks/useDashboard'
import type { FinanceSummary } from '@/types/finance-summary'

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
  }
}

/**
 * Hook for parallel fetching of current + previous periods
 * Used when comparison indicators are needed on dashboard
 *
 * Uses DashboardPeriodContext for selected week/month values.
 * Fetches both periods in parallel using useQueries for optimal performance.
 */
export function useDashboardMetricsWithComparison(): DashboardMetricsWithComparison {
  const { selectedWeek, previousWeek } = useDashboardPeriod()

  const results = useQueries({
    queries: [
      {
        queryKey: dashboardQueryKeys.metrics(selectedWeek),
        queryFn: () => fetchDashboardMetrics(selectedWeek),
        staleTime: 60 * 1000, // 1 min for current period (fresh data)
        gcTime: 5 * 60 * 1000, // 5 min garbage collection
        retry: 1,
      },
      {
        queryKey: dashboardQueryKeys.metrics(previousWeek),
        queryFn: () => fetchDashboardMetrics(previousWeek),
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
