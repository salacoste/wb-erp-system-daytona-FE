/**
 * useLegendPreferences Hook
 * Story 62.7-FE: Interactive Chart Legend
 *
 * Manages chart legend visibility preferences with localStorage persistence.
 * Ensures at least one series remains visible at all times.
 *
 * @see docs/stories/epic-62/story-62.7-fe-interactive-chart-legend.md
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  DEFAULT_VISIBLE_SERIES,
  STORAGE_KEY,
  METRIC_SERIES,
} from '@/components/custom/dashboard/chart-config'

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook to manage chart legend visibility preferences
 *
 * Features:
 * - localStorage persistence
 * - Prevents hiding all series (keeps at least 1)
 * - Show/hide all actions
 *
 * @returns Legend state and control functions
 *
 * @example
 * const { visibleSeries, toggleSeries, showAll, hideAll } = useLegendPreferences()
 */
export function useLegendPreferences() {
  // Initialize from localStorage or default
  const [visibleSeries, setVisibleSeries] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_VISIBLE_SERIES

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Validate stored data is an array with valid keys
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {
      // Ignore parsing errors, use default
    }

    return DEFAULT_VISIBLE_SERIES
  })

  // Persist to localStorage when visibility changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleSeries))
    } catch {
      // Ignore storage errors
    }
  }, [visibleSeries])

  /**
   * Toggle visibility of a single series
   * Prevents hiding the last visible series
   */
  const toggleSeries = useCallback((key: string) => {
    setVisibleSeries(prev => {
      const isVisible = prev.includes(key)

      // Prevent hiding all - must have at least 1
      if (isVisible && prev.length === 1) {
        return prev
      }

      return isVisible ? prev.filter(k => k !== key) : [...prev, key]
    })
  }, [])

  /**
   * Show all series
   */
  const showAll = useCallback(() => {
    setVisibleSeries(METRIC_SERIES.map(item => item.key))
  }, [])

  /**
   * Hide all series (keeps only 'orders' visible)
   */
  const hideAll = useCallback(() => {
    setVisibleSeries(['orders'])
  }, [])

  /**
   * Check if a series is visible
   */
  const isVisible = useCallback((key: string) => visibleSeries.includes(key), [visibleSeries])

  return {
    visibleSeries,
    toggleSeries,
    showAll,
    hideAll,
    isVisible,
  }
}

// ============================================================================
// Exports
// ============================================================================

export type UseLegendPreferencesReturn = ReturnType<typeof useLegendPreferences>
