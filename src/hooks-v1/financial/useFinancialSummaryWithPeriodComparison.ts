'use client'

/**
 * Financial Summary with Period Comparison Hook
 * Story 61.11-FE: Previous Period Data Integration
 *
 * Fetches financial data for BOTH current AND previous periods
 * for use in dashboard comparison displays (logistics_cost, storage_cost).
 *
 * Extracted from hooks.ts for file size compliance (Epic 74).
 */

import { useFinancialSummary } from './useFinancialSummary'
import {
  getPreviousWeekString,
  getPreviousMonthString,
  type UseFinancialSummaryComparisonOptions,
} from './financial-summary-helpers'

/**
 * Hook to fetch financial summary with comparison to previous period
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
