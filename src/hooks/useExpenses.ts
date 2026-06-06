/**
 * Hook for fetching expense breakdown data
 * Story 3.3: Expense Breakdown Visualization
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { FinanceSummary } from './useDashboard'
import { type ExpenseBreakdown, buildExpenseBreakdown } from './useExpenses-utils'
import { logger } from '@/lib/logger'

// Re-export types for consumers
export type { ExpenseItem, ExpenseBreakdown } from './useExpenses-utils'

/**
 * Hook to get expense breakdown from finance summary
 * Extracts expense categories from FinanceSummary for visualization
 *
 * @param weekOverride - Optional week to fetch (YYYY-Www format)
 */
export function useExpenses(weekOverride?: string) {
  return useQuery({
    queryKey: ['dashboard', 'expenses', weekOverride],
    queryFn: async (): Promise<ExpenseBreakdown> => {
      try {
        // Always check available weeks first to avoid 404 on incomplete/future weeks
        const weeksResponse = await apiClient.get<
          | Array<{ week: string; start_date: string }>
          | { data: Array<{ week: string; start_date: string }> }
        >('/v1/analytics/weekly/available-weeks')

        const weeksArray = Array.isArray(weeksResponse) ? weeksResponse : weeksResponse?.data || []
        const weeks = weeksArray.map(w => w.week)

        // Story 2.7: Empty array = no aggregated data yet
        if (!weeks || weeks.length === 0) {
          logger.debug(
            '[Expenses] No available weeks found. Financial data may not be processed yet.'
          )
          return { expenses: [], total: 0 }
        }

        let targetWeek = weekOverride

        // If weekOverride is not in available weeks, skip API call
        if (targetWeek && !weeks.includes(targetWeek)) {
          logger.debug(`[Expenses] Week ${targetWeek} not in available weeks, skipping`)
          return { expenses: [], total: 0 }
        }

        if (!targetWeek) {
          targetWeek = weeks[0]
        }

        logger.debug(`[Expenses] Fetching finance summary for week: ${targetWeek}`)

        const summaryResponse = await apiClient.get<{
          summary_total: FinanceSummary | null
          summary_rus: FinanceSummary | null
          summary_eaeu: FinanceSummary | null
          meta: { week: string; cabinet_id: string; generated_at: string; timezone: string }
        }>(`/v1/analytics/weekly/finance-summary?week=${targetWeek}`)

        const summary = summaryResponse.summary_total || summaryResponse.summary_rus

        if (!summary) {
          console.error('[Expenses] CRITICAL: No summary data for week', {
            week: targetWeek,
            weekOverride,
            summaryResponse,
          })
          return { expenses: [], total: 0 }
        }

        // Fetch previous period for W-o-W comparison
        let previousSummary: FinanceSummary | null = null
        const currentIdx = weeks.indexOf(targetWeek)
        if (currentIdx >= 0 && currentIdx + 1 < weeks.length) {
          const prevWeek = weeks[currentIdx + 1]
          try {
            const prevResponse = await apiClient.get<{
              summary_total: FinanceSummary | null
              summary_rus: FinanceSummary | null
            }>(`/v1/analytics/weekly/finance-summary?week=${prevWeek}`)
            previousSummary = prevResponse.summary_total || prevResponse.summary_rus || null
          } catch {
            // Previous period unavailable — W-o-W will be undefined
          }
        }

        const result = buildExpenseBreakdown(summary, previousSummary)
        logger.debug(
          `[Expenses] Found ${result.expenses.length} expense categories with total: ${result.total}`
        )
        return result
      } catch (error) {
        if (error instanceof Error && 'response' in error) {
          const httpError = error as { response?: { status?: number } }
          if (httpError.response?.status === 404) {
            apiClient
              .get('/v1/analytics/weekly/available-weeks')
              .then((r: unknown) => {
                console.error('[Expenses] CRITICAL: 404 for week from available-weeks list', {
                  error: (error as Error).message,
                  availableWeeks: r,
                })
              })
              .catch(() => {})
          }
        }
        logger.warn('[Expenses] Expense data not available:', error)
        if (error instanceof Error) {
          logger.warn('[Expenses] Error details:', { message: error.message, name: error.name })
        }
        return { expenses: [], total: 0 }
      }
    },
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}
