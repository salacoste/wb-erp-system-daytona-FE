/**
 * Expense Structure Hook
 * Story 63.9-FE: Expense Structure Pie Chart
 * Epic 63-FE: Dashboard Main Page Enhancement
 *
 * Fetches unit economics data with view_by=total for expense breakdown chart.
 * @see docs/stories/epic-63/story-63.9-fe-expense-structure-chart.md
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { UnitEconomicsResponse } from '@/types/unit-economics'

/**
 * Query keys for expense structure
 */
export const expenseStructureQueryKeys = {
  all: ['expense-structure'] as const,
  byWeek: (week: string) => [...expenseStructureQueryKeys.all, week] as const,
}

interface ExpenseStructureParams {
  /** ISO week string (e.g., "2026-W05") */
  week: string
  /** Enable/disable the query */
  enabled?: boolean
}

/**
 * Fetch expense structure from unit-economics API
 */
async function fetchExpenseStructure(week: string): Promise<UnitEconomicsResponse> {
  return apiClient.get<UnitEconomicsResponse>(
    `/v1/analytics/unit-economics?week=${week}&view_by=total`
  )
}

type UseExpenseStructureOptions = Omit<
  UseQueryOptions<UnitEconomicsResponse, Error>,
  'queryKey' | 'queryFn'
>

/**
 * useExpenseStructure Hook
 *
 * Fetches aggregated expense structure for pie chart display.
 * Returns total costs breakdown by category.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useExpenseStructure({ week: '2026-W05' })
 * ```
 */
export function useExpenseStructure(
  { week, enabled = true }: ExpenseStructureParams,
  options?: UseExpenseStructureOptions
) {
  return useQuery<UnitEconomicsResponse, Error>({
    queryKey: expenseStructureQueryKeys.byWeek(week),
    queryFn: () => fetchExpenseStructure(week),
    enabled: !!week && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 30 * 60 * 1000, // 30 minutes in cache
    retry: 2,
    ...options,
  })
}
