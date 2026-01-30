/**
 * Hooks for dashboard data fetching
 * Story 2.4: Initial Data Display After Processing
 * Story 3.2: Key Metric Cards Display
 * Story 60.4-FE: Connect Dashboard to Period State - Week parameter support
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { isValidWeekFormat } from '@/lib/period-helpers'
import type { FinanceSummary } from '@/types/finance-summary'

export interface DashboardMetrics {
  totalPayable?: number
  revenue?: number
  grossProfit?: number
  totalProducts?: number
}

export interface UseDashboardMetricsOptions {
  /** ISO week string (e.g., "2026-W05") - defaults to latest available */
  week?: string
}

/** Query keys for dashboard data - Story 60.4-FE: Include week for cache isolation */
export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  metrics: (week?: string) => [...dashboardQueryKeys.all, 'metrics', week] as const,
  expenses: (week?: string) => [...dashboardQueryKeys.all, 'expenses', week] as const,
}

/** Fetch finance summary for a specific week */
async function fetchFinanceSummaryForWeek(week: string): Promise<DashboardMetrics> {
  const summaryResponse = await apiClient.get<{
    summary_total: FinanceSummary | null
    summary_rus: FinanceSummary | null
    summary_eaeu: FinanceSummary | null
    meta: { week: string; cabinet_id: string; generated_at: string; timezone: string }
  }>(`/v1/analytics/weekly/finance-summary?week=${week}`)

  const summary = summaryResponse.summary_total || summaryResponse.summary_rus
  if (!summary) {
    console.error('[Dashboard] No summary data for week:', week)
    return {}
  }

  return {
    totalPayable: summary.to_pay_goods_total ?? summary.to_pay_goods,
    revenue: summary.sale_gross_total ?? summary.sale_gross,
    grossProfit: summary.gross_profit ?? undefined,
  }
}

/** Get latest available week from API */
async function getLatestAvailableWeek(): Promise<string | null> {
  const weeksResponse = await apiClient.get<
    | Array<{ week: string; start_date: string }>
    | { data: Array<{ week: string; start_date: string }> }
  >('/v1/analytics/weekly/available-weeks')

  const weeksArray = Array.isArray(weeksResponse) ? weeksResponse : weeksResponse?.data || []
  return weeksArray.length > 0 ? weeksArray[0].week : null
}

/**
 * Hook to get dashboard metrics with optional week parameter
 * Story 60.4-FE: Added week parameter support for period selector integration
 *
 * @param options - Configuration including optional week
 */
export function useDashboardMetrics(options?: UseDashboardMetricsOptions) {
  const { week } = options || {}

  // Validate week format if provided
  const isValidWeek = !week || isValidWeekFormat(week)

  return useQuery({
    queryKey: dashboardQueryKeys.metrics(week),
    queryFn: async (): Promise<DashboardMetrics> => {
      if (week && !isValidWeek) {
        throw new Error(`Invalid week format: ${week}. Expected YYYY-Www (e.g., 2026-W05)`)
      }

      try {
        // If week is specified, fetch directly for that week
        if (week) {
          return await fetchFinanceSummaryForWeek(week)
        }

        // Otherwise, get latest available week first
        const latestWeek = await getLatestAvailableWeek()
        if (!latestWeek) {
          console.info('[Dashboard] No available weeks found - data may not be processed yet')
          return {}
        }

        return await fetchFinanceSummaryForWeek(latestWeek)
      } catch (error) {
        console.warn('[Dashboard] Finance summary not available:', error)
        return {}
      }
    },
    staleTime: week ? 60 * 1000 : 30 * 1000, // 60s for specific week, 30s for latest
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
    enabled: isValidWeek,
  })
}

// Re-export FinanceSummary type for backward compatibility
export type { FinanceSummary }
