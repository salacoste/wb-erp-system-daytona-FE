/**
 * Sortable Table Hook
 * Story 62.8-FE: Daily Metrics Table View
 *
 * Generic hook for table column sorting with ascending/descending/none toggle.
 * Follows aria-sort pattern: asc -> desc -> none cycle.
 *
 * @see docs/stories/epic-62/story-62.8-fe-daily-metrics-table.md
 */

import { useState, useMemo, useCallback } from 'react'

/** Sort direction states */
export type SortDirection = 'asc' | 'desc' | null

/** Sort state for a table */
export interface SortState<K extends string> {
  /** Currently sorted column key */
  sortKey: K | null
  /** Current sort direction */
  sortDirection: SortDirection
}

/** Hook return type */
export interface UseSortableTableReturn<T, K extends string> {
  /** Data sorted according to current state */
  sortedData: T[]
  /** Currently sorted column key */
  sortKey: K | null
  /** Current sort direction */
  sortDirection: SortDirection
  /** Toggle sort for a column */
  toggleSort: (key: K) => void
  /** Clear all sorting */
  clearSort: () => void
}

/**
 * Hook for managing sortable table state.
 *
 * @param data - Array of data to sort
 * @param getComparator - Function to get comparator for a key
 * @returns Sorted data and sort controls
 *
 * @example
 * const { sortedData, sortKey, sortDirection, toggleSort } = useSortableTable(
 *   data,
 *   (key) => (a, b) => a[key] - b[key]
 * )
 */
export function useSortableTable<T, K extends string>(
  data: T[],
  getComparator: (key: K) => (a: T, b: T) => number
): UseSortableTableReturn<T, K> {
  const [sortKey, setSortKey] = useState<K | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data

    const comparator = getComparator(sortKey)
    const sorted = [...data].sort(comparator)

    return sortDirection === 'desc' ? sorted.reverse() : sorted
  }, [data, sortKey, sortDirection, getComparator])

  const toggleSort = useCallback(
    (key: K) => {
      if (sortKey === key) {
        // Cycle: asc -> desc -> null
        setSortDirection(prev => (prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'))
        if (sortDirection === 'desc') {
          setSortKey(null)
        }
      } else {
        setSortKey(key)
        setSortDirection('asc')
      }
    },
    [sortKey, sortDirection]
  )

  const clearSort = useCallback(() => {
    setSortKey(null)
    setSortDirection(null)
  }, [])

  return {
    sortedData,
    sortKey,
    sortDirection,
    toggleSort,
    clearSort,
  }
}
