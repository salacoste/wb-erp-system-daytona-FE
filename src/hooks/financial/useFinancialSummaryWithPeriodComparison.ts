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

  // Do not expose React Query placeholder data as actual period data. Dashboard period
  // selectors must never render the previous week's financial summary while the newly
  // selected week/month is still loading.
  const currentData = currentQuery.isPlaceholderData ? undefined : currentQuery.data
  // Handle previous period errors gracefully - return undefined instead of error.
  const previousData =
    previousQuery.isError || previousQuery.isPlaceholderData ? undefined : previousQuery.data

  // Keep selected-period readiness separate from the optional comparison request. A cold
  // previous period can take substantially longer than the current period and must not keep
  // the dashboard's primary metrics in a full-page skeleton after current data has arrived.
  const isCurrentLoading = currentQuery.isLoading || currentQuery.isPlaceholderData
  const isComparisonLoading =
    !previousQuery.isError && (previousQuery.isLoading || previousQuery.isPlaceholderData)
  const isLoading = isCurrentLoading || isComparisonLoading

  // Current period error is critical, previous period error is graceful
  const isError = currentQuery.isError
  const error = currentQuery.error

  return {
    current: currentData,
    previous: previousData,
    isCurrentLoading,
    isComparisonLoading,
    isLoading,
    isError,
    error,
  }
}
