/**
 * Financial Summary Hooks
 * Story 3.5: Financial Summary View
 *
 * React Query hooks for financial summary data:
 * - useFinancialSummary - Single week/month summary
 * - useFinancialSummaryComparison - Two-week comparison
 * - useAvailableWeeks - Available weeks list
 * - useMultiWeekFinancialSummary - Multiple weeks aggregated
 */

import { useQuery, useQueries, keepPreviousData } from '@tanstack/react-query'
import { getISOWeek, getISOWeekYear } from 'date-fns'
import { apiClient } from '@/lib/api-client'
import { getWeeksInMonth } from '@/lib/period-helpers'
import { getLastCompletedWeek } from '@/lib/margin-helpers'
import { aggregateFinanceSummaries } from './aggregation'
import type { FinanceSummaryResponse, WeekData } from './types'
import type { FinanceSummary } from '../useDashboard'

/**
 * Hook to get financial summary for a specific week or month
 * Supports both week format (YYYY-Www) and month format (YYYY-MM)
 *
 * For months, aggregates data from all weeks in that month
 *
 * Story 61.13-FE: Margin Calculation Consistency
 * Both week and month periods use the same Gross Margin formula:
 * margin_pct = (sale_gross_total - cogs_total) / sale_gross_total * 100
 */
export function useFinancialSummary(period: string, periodType: 'week' | 'month' = 'week') {
  // For week periods, use the existing single-week query
  if (periodType === 'week') {
    return useQuery({
      queryKey: ['financial', 'summary', period, 'week'],
      queryFn: async (): Promise<FinanceSummaryResponse> => {
        const response = await apiClient.get<FinanceSummaryResponse>(
          `/v1/analytics/weekly/finance-summary?week=${period}`
        )

        // Story 61.13-FE: Apply margin calculation to single week response
        // Use aggregateFinanceSummaries to ensure consistent margin_pct calculation
        const summary = response.summary_total || response.summary_rus
        if (summary) {
          const processedSummary = aggregateFinanceSummaries([summary])
          return {
            ...response,
            summary_total: processedSummary,
            summary_rus: response.summary_rus ? processedSummary : null,
          }
        }

        return response
      },
      enabled: !!period,
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
      placeholderData: keepPreviousData,
    })
  }

  // For month periods, use multi-week aggregation
  // BUG FIX: Filter out weeks after last completed week
  const allWeeksInMonth = getWeeksInMonth(period)
  const lastCompletedWeek = getLastCompletedWeek()
  const weeksInMonth = allWeeksInMonth.filter(week => week <= lastCompletedWeek)

  return useQuery({
    queryKey: ['financial', 'summary', period, 'month', weeksInMonth],
    queryFn: async (): Promise<FinanceSummaryResponse> => {
      // Fetch all weeks in parallel
      const weekPromises = weeksInMonth.map((week: string) =>
        apiClient.get<FinanceSummaryResponse>(`/v1/analytics/weekly/finance-summary?week=${week}`)
      )

      const responses = await Promise.all(weekPromises)

      // Aggregate all summaries
      const summaries = responses
        .map(r => r.summary_total || r.summary_rus)
        .filter(Boolean) as FinanceSummary[]

      const aggregatedSummary = aggregateFinanceSummaries(summaries)

      return {
        summary_total: aggregatedSummary,
        summary_rus: aggregatedSummary,
        summary_eaeu: null,
        meta: {
          week: weeksInMonth.join(', '),
          cabinet_id: responses[0]?.meta?.cabinet_id || '',
          generated_at: new Date().toISOString(),
          timezone: 'Europe/Moscow',
        },
      }
    },
    enabled: !!period && weeksInMonth.length > 0,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  })
}

/**
 * Hook to get financial summary for two weeks (for comparison)
 */
export function useFinancialSummaryComparison(week1: string, week2: string) {
  const query1 = useFinancialSummary(week1)
  const query2 = useFinancialSummary(week2)

  return {
    week1: query1,
    week2: query2,
    isLoading: query1.isLoading || query2.isLoading,
    isError: query1.isError || query2.isError,
    error: query1.error || query2.error,
  }
}

/**
 * Hook to get list of available weeks
 */
export function useAvailableWeeks() {
  return useQuery({
    queryKey: ['financial', 'available-weeks'],
    queryFn: async (): Promise<WeekData[]> => {
      const response = await apiClient.get<Array<WeekData> | { data: Array<WeekData> }>(
        '/v1/analytics/weekly/available-weeks'
      )

      // Handle both array and object formats
      const weeksArray = Array.isArray(response) ? response : response?.data || []

      return weeksArray
    },
    staleTime: 60000,
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Options for useFinancialSummaryWithPeriodComparison hook
 * Story 61.11-FE: Previous Period Data Integration
 */
export interface UseFinancialSummaryComparisonOptions {
  /** Period type: 'week' or 'month' */
  periodType: 'week' | 'month'
  /** ISO week (YYYY-Www) or month (YYYY-MM) */
  period: string
  /** Enable/disable query */
  enabled?: boolean
}

/**
 * Hook to fetch financial summary with comparison to previous period
 * Story 61.11-FE: Previous Period Data Integration
 *
 * Fetches financial data for BOTH current AND previous periods
 * for use in dashboard comparison displays (logistics_cost, storage_cost).
 *
 * @example
 * const { current, previous, isLoading } = useFinancialSummaryWithPeriodComparison({
 *   periodType: 'week',
 *   period: '2026-W05',
 * })
 *
 * // Access logistics/storage for both periods
 * console.log(current?.summary_total?.logistics_cost)
 * console.log(previous?.summary_total?.storage_cost)
 */
export function useFinancialSummaryWithPeriodComparison(
  options: UseFinancialSummaryComparisonOptions
) {
  const { periodType, period, enabled = true } = options

  // Check if query should be enabled (both enabled flag AND valid period)
  const isEnabled = enabled && !!period

  // Calculate previous period (only if enabled)
  const previousPeriod =
    isEnabled && period
      ? periodType === 'week'
        ? getPreviousWeekString(period)
        : getPreviousMonthString(period)
      : ''

  // Use empty string to disable queries when not enabled
  const effectivePeriod = isEnabled ? period : ''

  // Query current period (disabled when effectivePeriod is empty)
  const currentQuery = useFinancialSummary(effectivePeriod, periodType)

  // Query previous period (disabled when previousPeriod is empty)
  const previousQuery = useFinancialSummary(previousPeriod, periodType)

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

/**
 * Get previous ISO week string
 * Handles year boundary: "2026-W01" -> "2025-W52"
 */
function getPreviousWeekString(week: string): string {
  const match = week.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return week

  const [, yearStr, weekStr] = match
  const year = parseInt(yearStr, 10)
  const weekNum = parseInt(weekStr, 10)

  if (weekNum === 1) {
    // Go to last week of previous year (Week 52 or 53)
    // Dec 28 is always in the last week of the year
    const lastYearDec = new Date(year - 1, 11, 28)
    const lastWeek = getISOWeek(lastYearDec)
    const lastWeekYear = getISOWeekYear(lastYearDec)
    return `${lastWeekYear}-W${lastWeek.toString().padStart(2, '0')}`
  }

  return `${year}-W${(weekNum - 1).toString().padStart(2, '0')}`
}

/**
 * Get previous month string
 * Handles year boundary: "2026-01" -> "2025-12"
 */
function getPreviousMonthString(month: string): string {
  const match = month.match(/^(\d{4})-(\d{2})$/)
  if (!match) return month

  const [, yearStr, monthStr] = match
  const year = parseInt(yearStr, 10)
  const monthNum = parseInt(monthStr, 10)

  if (monthNum === 1) {
    return `${year - 1}-12`
  }

  return `${year}-${(monthNum - 1).toString().padStart(2, '0')}`
}

/**
 * Hook to get aggregated financial summary for multiple weeks
 * Fetches each week and combines the results
 */
export function useMultiWeekFinancialSummary(weeks: string[]) {
  const queries = useQueries({
    queries: weeks.map(week => ({
      queryKey: ['financial', 'summary', week],
      queryFn: async (): Promise<FinanceSummaryResponse> => {
        const response = await apiClient.get<FinanceSummaryResponse>(
          `/v1/analytics/weekly/finance-summary?week=${week}`
        )
        return response
      },
      enabled: !!week,
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
    })),
  })

  const isLoading = queries.some(q => q.isLoading)
  const isError = queries.some(q => q.isError)
  const error = queries.find(q => q.error)?.error

  // Aggregate data from all weeks
  const aggregatedSummary =
    !isLoading && !isError
      ? aggregateFinanceSummaries(
          queries
            .map(q => q.data?.summary_total || q.data?.summary_rus || null)
            .filter(Boolean) as FinanceSummary[]
        )
      : null

  return {
    data: aggregatedSummary,
    isLoading,
    isError,
    error,
    weekCount: weeks.length,
    refetch: () => queries.forEach(q => q.refetch()),
  }
}
