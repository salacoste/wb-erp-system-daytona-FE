/**
 * Hook to detect advertising empty state
 * Story 60.6-FE: Sync Advertising Widget with Global Period
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * Extracts empty state detection logic from AdvertisingDashboardWidget
 * for better testability and reusability.
 */

import { useMemo } from 'react'
import type { AdvertisingAnalyticsResponse } from '@/types/advertising-analytics'
import type { DateRange } from '@/components/custom/AdvertisingEmptyState'

export interface UseAdvertisingEmptyStateResult {
  /** Whether the advertising data is empty (no data or zero sales) */
  isEmpty: boolean
  /** Available date range from API response (for empty state display) */
  availableRange: DateRange | undefined
}

/**
 * Detects empty state for advertising analytics data.
 *
 * Empty state conditions:
 * - No data object
 * - No summary in data
 * - Total sales equals zero
 *
 * @param data - Advertising analytics response from API
 * @returns Empty state detection result
 *
 * @example
 * const { isEmpty, availableRange } = useAdvertisingEmptyState(data)
 *
 * if (isEmpty) {
 *   return <AdvertisingEmptyState availableRange={availableRange} />
 * }
 */
export function useAdvertisingEmptyState(
  data: AdvertisingAnalyticsResponse | undefined
): UseAdvertisingEmptyStateResult {
  return useMemo(() => {
    // Detect empty state: no data or zero sales
    const isEmpty = !data || !data.summary || data.summary.total_sales === 0

    // Extract available range from API response
    const availableRange: DateRange | undefined = data?.meta?.date_range
      ? {
          from: data.meta.date_range.from,
          to: data.meta.date_range.to,
        }
      : undefined

    return { isEmpty, availableRange }
  }, [data])
}
