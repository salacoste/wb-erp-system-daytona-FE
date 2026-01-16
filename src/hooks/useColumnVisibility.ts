/**
 * useColumnVisibility Hook
 * Story 6.3-FE: ROI & Profit Metrics Display
 *
 * Manages column visibility preferences with localStorage persistence.
 * Allows users to show/hide optional columns in analytics tables.
 */

import { useState, useCallback, useEffect } from 'react'

/**
 * Column visibility state for analytics tables
 */
export interface ColumnVisibility {
  /** Show Profit per Unit column */
  profit_per_unit: boolean
  /** Show ROI column */
  roi: boolean
  /** Show Markup % column */
  markup_percent: boolean
}

/**
 * Default column visibility settings
 */
const DEFAULT_VISIBILITY: ColumnVisibility = {
  profit_per_unit: true,
  roi: true,
  markup_percent: false, // Hidden by default, less common metric
}

/**
 * Hook for managing column visibility with localStorage persistence
 *
 * @param storageKey - Unique key for localStorage (e.g., 'analytics-sku-columns')
 * @returns Object with visibility state, toggle function, and setAll function
 *
 * @example
 * const { visibility, toggleColumn, setAll } = useColumnVisibility('analytics-sku-columns')
 *
 * // Check if column is visible
 * if (visibility.roi) {
 *   // Render ROI column
 * }
 *
 * // Toggle a column
 * toggleColumn('profit_per_unit')
 *
 * // Set all at once
 * setAll({ profit_per_unit: true, roi: false, markup_percent: false })
 */
export function useColumnVisibility(storageKey: string) {
  const [visibility, setVisibility] = useState<ColumnVisibility>(() => {
    // Only access localStorage on client side
    if (typeof window === 'undefined') {
      return DEFAULT_VISIBILITY
    }

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with defaults to handle new columns
        return { ...DEFAULT_VISIBILITY, ...parsed }
      }
    } catch {
      // Ignore parsing errors, use defaults
    }
    return DEFAULT_VISIBILITY
  })

  // Sync to localStorage when visibility changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(visibility))
      } catch {
        // Ignore storage errors (e.g., quota exceeded)
      }
    }
  }, [storageKey, visibility])

  /**
   * Toggle a single column's visibility
   */
  const toggleColumn = useCallback((column: keyof ColumnVisibility) => {
    setVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }))
  }, [])

  /**
   * Set visibility for all columns at once
   */
  const setAll = useCallback((newVisibility: Partial<ColumnVisibility>) => {
    setVisibility((prev) => ({
      ...prev,
      ...newVisibility,
    }))
  }, [])

  /**
   * Reset to default visibility
   */
  const reset = useCallback(() => {
    setVisibility(DEFAULT_VISIBILITY)
  }, [])

  /**
   * Count of visible optional columns
   */
  const visibleCount = Object.values(visibility).filter(Boolean).length
  const totalCount = Object.keys(visibility).length

  return {
    visibility,
    toggleColumn,
    setAll,
    reset,
    visibleCount,
    totalCount,
  }
}

/**
 * Column metadata for UI rendering
 */
export interface ColumnDefinition {
  key: keyof ColumnVisibility
  label: string
  description: string
}

/**
 * Available optional columns with metadata
 */
export const OPTIONAL_COLUMNS: ColumnDefinition[] = [
  {
    key: 'profit_per_unit',
    label: 'Прибыль/ед.',
    description: 'Прибыль на единицу товара (Прибыль ÷ Количество)',
  },
  {
    key: 'roi',
    label: 'ROI',
    description: 'Рентабельность инвестиций ((Прибыль ÷ COGS) × 100%)',
  },
  {
    key: 'markup_percent',
    label: 'Наценка %',
    description: 'Процент наценки ((Прибыль ÷ COGS) × 100%)',
  },
]
