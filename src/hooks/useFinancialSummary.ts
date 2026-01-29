/**
 * Hooks for financial summary data fetching
 * Story 3.5: Financial Summary View
 *
 * Provides:
 * - Single week summary
 * - Two-week comparison
 * - Available weeks list
 * - All financial metrics from finance-summary endpoint
 */

import { useQuery, useQueries, keepPreviousData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { FinanceSummary } from './useDashboard'
import { getWeeksInMonth } from '@/lib/period-helpers'

/**
 * Response from finance-summary endpoint
 */
export interface FinanceSummaryResponse {
  summary_total: FinanceSummary | null
  summary_rus: FinanceSummary | null
  summary_eaeu: FinanceSummary | null
  meta: {
    week: string
    cabinet_id: string
    generated_at: string
    timezone: string
  }
}

/**
 * Available week data
 */
export interface WeekData {
  week: string
  start_date: string
}

/**
 * Hook to get financial summary for a specific week or month
 * Supports both week format (YYYY-Www) and month format (YYYY-MM)
 *
 * For months, aggregates data from all weeks in that month
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
        return response
      },
      enabled: !!period,
      staleTime: 30000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes (renamed from cacheTime)
      placeholderData: keepPreviousData, // Keep previous data while loading new week - prevents scroll jump
    })
  }

  // For month periods, use multi-week aggregation
  const weeksInMonth = getWeeksInMonth(period)

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
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
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
    staleTime: 60000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Get current ISO week (YYYY-Www format)
 */
export function getCurrentIsoWeek(): string {
  const now = new Date()

  // Set to nearest Thursday (ISO week date definition)
  const thursday = new Date(now.getTime())
  thursday.setDate(now.getDate() + 3 - ((now.getDay() + 6) % 7))

  // January 4 is always in week 1
  const jan4 = new Date(thursday.getFullYear(), 0, 4)

  // Calculate week number
  const weekNumber = Math.ceil(
    ((thursday.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7
  )

  return `${thursday.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`
}

/**
 * Format week string for display (e.g., "2025-W46" → "Неделя 46, 2025")
 */
export function formatWeekDisplay(week: string): string {
  const match = week.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return week

  const [, year, weekNum] = match
  return `Неделя ${parseInt(weekNum, 10)}, ${year}`
}

/**
 * Format week string with date range (e.g., "2025-W46" → "Неделя 46 (11.11 - 17.11)")
 */
export function formatWeekWithDateRange(week: string): string {
  const match = week.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return week

  const [, year, weekNumStr] = match
  const weekNum = parseInt(weekNumStr, 10)

  // Calculate first day of week (Monday)
  const jan4 = new Date(parseInt(year, 10), 0, 4)
  const jan4Day = jan4.getDay() || 7
  const weekStart = new Date(jan4.getTime())
  weekStart.setDate(jan4.getDate() - jan4Day + 1 + (weekNum - 1) * 7)

  // Calculate last day of week (Sunday)
  const weekEnd = new Date(weekStart.getTime())
  weekEnd.setDate(weekStart.getDate() + 6)

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return `${day}.${month}`
  }

  return `Неделя ${weekNum} (${formatDate(weekStart)} - ${formatDate(weekEnd)})`
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

/**
 * Aggregate multiple FinanceSummary objects into one
 * Sums all numeric fields
 */
function aggregateFinanceSummaries(summaries: FinanceSummary[]): FinanceSummary | null {
  if (summaries.length === 0) return null
  if (summaries.length === 1) return summaries[0]

  // Define numeric fields to aggregate
  const numericFields: (keyof FinanceSummary)[] = [
    'sales_gross_total',
    'sales_gross',
    'returns_gross_total',
    'returns_gross',
    'sale_gross_total',
    'sale_gross',
    'to_pay_goods_total',
    'to_pay_goods',
    'total_commission_rub_total',
    'total_commission_rub',
    'payout_total',
    'logistics_cost_total',
    'logistics_cost',
    'storage_cost_total',
    'storage_cost',
    'paid_acceptance_cost_total',
    'paid_acceptance_cost',
    'penalties_total',
    'wb_commission_adj_total',
    'wb_commission_adj',
    'loyalty_fee_total',
    'loyalty_fee',
    'loyalty_points_withheld_total',
    'loyalty_points_withheld',
    'loyalty_compensation_total',
    'loyalty_compensation',
    'acquiring_fee_total',
    'acquiring_fee',
    'commission_sales_total',
    'commission_sales',
    'other_adjustments_net_total',
    'other_adjustments_net',
    'seller_delivery_revenue_total',
    'seller_delivery_revenue',
    'wb_services_cost_total',
    'wb_services_cost',
    'wb_promotion_cost_total',
    'wb_promotion_cost',
    'wb_jam_cost_total',
    'wb_jam_cost',
    'wb_other_services_cost_total',
    'wb_other_services_cost',
    'wb_sales_gross_total',
    'wb_sales_gross',
    'wb_returns_gross_total',
    'wb_returns_gross',
    'retail_price_total',
    'retail_price_total_total',
    'cogs_total',
  ]

  const result: Partial<FinanceSummary> = {
    week: summaries.map(s => s.week).join(', '),
  }

  // Sum all numeric fields
  for (const field of numericFields) {
    const sum = summaries.reduce((acc, summary) => {
      const value = summary[field]
      if (typeof value === 'number') {
        return acc + value
      }
      return acc
    }, 0)

    // Only set if at least one summary had this field
    if (summaries.some(s => typeof s[field] === 'number')) {
      ;(result as Record<string, number>)[field] = sum
    }
  }

  // For COGS coverage, use MAX across weeks (same products appear each week)
  // Using MAX avoids counting the same product multiple times
  const maxProductsTotal = Math.max(...summaries.map(s => s.products_total || 0))
  const maxProductsWithCogs = Math.max(...summaries.map(s => s.products_with_cogs || 0))

  if (maxProductsTotal > 0) {
    result.products_total = maxProductsTotal
    result.products_with_cogs = Math.min(maxProductsWithCogs, maxProductsTotal) // Can't exceed total
    result.cogs_coverage_pct = (result.products_with_cogs / maxProductsTotal) * 100
  }

  // Calculate gross_profit only if aggregated coverage is 100%
  // (i.e., all products across all weeks have COGS assigned)
  if (result.cogs_coverage_pct === 100 && result.payout_total && result.cogs_total) {
    result.gross_profit = result.payout_total - result.cogs_total
  }

  return result as FinanceSummary
}

/**
 * Calculate percentage change between two values
 */
export function calculateChange(
  current: number | undefined | null,
  previous: number | undefined | null
): {
  value: number | null
  percentage: number | null
  trend: 'up' | 'down' | 'same'
} {
  if (
    current === undefined ||
    current === null ||
    previous === undefined ||
    previous === null ||
    previous === 0
  ) {
    return { value: null, percentage: null, trend: 'same' }
  }

  const value = current - previous
  const percentage = (value / Math.abs(previous)) * 100

  const trend = value > 0 ? 'up' : value < 0 ? 'down' : 'same'

  return { value, percentage, trend }
}
