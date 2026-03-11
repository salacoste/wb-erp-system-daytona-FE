'use client'

/**
 * Multi-Week Financial Summary Hook
 * Story 3.5: Financial Summary View
 *
 * Fetches and aggregates financial summaries for multiple weeks.
 * Extracted from hooks.ts for file size compliance (Epic 74).
 */

import { useQueries } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { aggregateFinanceSummaries } from './aggregation'
import type { FinanceSummaryResponse } from './types'
import type { FinanceSummary } from '../useDashboard'

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
