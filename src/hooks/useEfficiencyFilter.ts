/**
 * Efficiency Filter Hook
 * Story 63.4-FE: Advertising Efficiency Filter UI
 *
 * Hook for managing advertising efficiency filter state.
 * Syncs filter with URL search params for persistence.
 *
 * Features:
 * - URL param sync (?efficiency=loss)
 * - Toggle behavior (click active to deselect)
 * - Filter persistence on page refresh
 *
 * @see docs/stories/epic-63/story-63.4-fe-advertising-efficiency-filter.md
 */

'use client'

import { useCallback, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { FilterableEfficiencyStatus } from '@/types/efficiency-filter'
import type { EfficiencyStatus } from '@/types/advertising-analytics'

/** URL parameter name for efficiency filter */
const EFFICIENCY_PARAM = 'efficiency'

/**
 * Result returned by useEfficiencyFilter hook.
 */
export interface UseEfficiencyFilterResult {
  /** Currently active filter (null = 'Все') */
  activeFilter: FilterableEfficiencyStatus | null
  /** Set or toggle a filter */
  setFilter: (status: FilterableEfficiencyStatus | null) => void
  /** Clear filter (same as setFilter(null)) */
  clearFilter: () => void
  /** Check if a specific filter is active */
  isActive: (status: FilterableEfficiencyStatus) => boolean
  /** Whether any filter is active */
  hasActiveFilter: boolean
}

/**
 * Validate if a string is a valid filterable efficiency status.
 */
function isValidEfficiencyStatus(value: string | null): value is FilterableEfficiencyStatus {
  if (!value) return false
  const validStatuses: FilterableEfficiencyStatus[] = [
    'excellent',
    'good',
    'moderate',
    'poor',
    'loss',
  ]
  return validStatuses.includes(value as FilterableEfficiencyStatus)
}

/**
 * Hook for managing efficiency filter state with URL synchronization.
 *
 * The filter value is stored in URL search params for:
 * - Persistence on page refresh
 * - Shareable filtered views
 * - Back/forward navigation support
 *
 * @returns Filter state and control functions
 *
 * @example
 * const { activeFilter, setFilter, clearFilter } = useEfficiencyFilter();
 *
 * // Apply filter
 * setFilter('loss');
 *
 * // Toggle filter (click same filter to deselect)
 * setFilter(activeFilter === 'loss' ? null : 'loss');
 *
 * // Clear filter
 * clearFilter();
 */
export function useEfficiencyFilter(): UseEfficiencyFilterResult {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Read current filter from URL
  const activeFilter = useMemo(() => {
    const param = searchParams.get(EFFICIENCY_PARAM)
    return isValidEfficiencyStatus(param) ? param : null
  }, [searchParams])

  // Set filter and update URL
  const setFilter = useCallback(
    (status: FilterableEfficiencyStatus | null) => {
      const params = new URLSearchParams(searchParams.toString())

      if (status === null || status === activeFilter) {
        // Clear filter or toggle off
        params.delete(EFFICIENCY_PARAM)
      } else {
        params.set(EFFICIENCY_PARAM, status)
      }

      // Update URL without scroll
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
      router.push(newUrl, { scroll: false })
    },
    [router, pathname, searchParams, activeFilter]
  )

  // Clear filter (convenience function)
  const clearFilter = useCallback(() => {
    setFilter(null)
  }, [setFilter])

  // Check if specific filter is active
  const isActive = useCallback(
    (status: FilterableEfficiencyStatus) => activeFilter === status,
    [activeFilter]
  )

  return {
    activeFilter,
    setFilter,
    clearFilter,
    isActive,
    hasActiveFilter: activeFilter !== null,
  }
}

/**
 * Convert filter value to API parameter format.
 * Returns undefined for null (no filter) to exclude from request.
 */
export function getEfficiencyFilterParam(
  filter: FilterableEfficiencyStatus | null
): EfficiencyStatus | 'all' | undefined {
  return filter ?? undefined
}
