/**
 * Dashboard Metrics with Period - Fetch Functions & Types
 * Extracted from useDashboardMetricsWithPeriod.ts for file size compliance (Epic 74)
 */

import { apiClient } from '@/lib/api-client'
import type { DashboardMetrics } from '@/hooks/useDashboard'
import type { FinanceSummary } from '@/types/finance-summary'
import { getWeeksInMonth } from '@/lib/period-helpers'
import { getLastCompletedWeek } from '@/lib/margin-helpers'

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Fetch Functions
// ============================================================================

/** Fetch finance summary for a specific week and transform to DashboardMetrics */
export async function fetchDashboardMetrics(week: string): Promise<DashboardMetrics> {
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
export async function fetchMonthlyMetrics(month: string): Promise<DashboardMetrics> {
  try {
    // BUG FIX: Filter out weeks after last completed week to avoid 404 errors
    const allWeeksInMonth = getWeeksInMonth(month)
    const lastCompletedWeek = getLastCompletedWeek()
    const weeksInMonth = allWeeksInMonth.filter(week => week <= lastCompletedWeek)

    if (weeksInMonth.length === 0) {
      return {}
    }

    const weeklyPromises = weeksInMonth.map(week => fetchDashboardMetrics(week))
    const weeklyResults = await Promise.allSettled(weeklyPromises)

    let aggregatedTotalPayable = 0
    let aggregatedRevenue = 0
    let aggregatedGrossProfit = 0

    weeklyResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        aggregatedTotalPayable += result.value.totalPayable ?? 0
        // eslint-disable-next-line no-restricted-syntax -- AGGREGATION-REDUCE: revenue null per week = no contribution to weekly sum
        aggregatedRevenue += result.value.revenue ?? 0
        // eslint-disable-next-line no-restricted-syntax -- AGGREGATION-REDUCE: grossProfit null per week = no contribution to weekly sum
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

// ============================================================================
// Query Config Constants
// ============================================================================

/** Stale time for current period (1 minute - fresh data) */
export const CURRENT_PERIOD_STALE_TIME = 60 * 1000

/** GC time for current period (5 minutes) */
export const CURRENT_PERIOD_GC_TIME = 5 * 60 * 1000

/** Stale time for previous period (5 minutes - historical data) */
export const PREVIOUS_PERIOD_STALE_TIME = 5 * 60 * 1000

/** GC time for previous period (10 minutes) */
export const PREVIOUS_PERIOD_GC_TIME = 10 * 60 * 1000
