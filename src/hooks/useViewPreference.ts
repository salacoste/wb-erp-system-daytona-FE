/**
 * View Preference Hook
 * Story 62.9-FE: Chart/Table View Toggle
 *
 * Manages user preference for chart vs table view with localStorage persistence.
 * SSR-safe with default fallback on server-side.
 *
 * @see docs/stories/epic-62/story-62.9-fe-chart-table-view-toggle.md
 */

import { useState, useEffect } from 'react'

/** Available view types */
export type ViewType = 'chart' | 'table'

/** localStorage key for persisting preference */
const STORAGE_KEY = 'dashboard-daily-view'

/** Default view when no preference stored */
const DEFAULT_VIEW: ViewType = 'chart'

/**
 * Hook to manage view preference with localStorage persistence.
 *
 * @returns Tuple of [currentView, setView]
 *
 * @example
 * const [view, setView] = useViewPreference()
 * // view: 'chart' | 'table'
 * // setView: (newView: ViewType) => void
 */
export function useViewPreference(): readonly [ViewType, (view: ViewType) => void] {
  const [view, setView] = useState<ViewType>(() => {
    // SSR-safe: check for window before accessing localStorage
    if (typeof window === 'undefined') return DEFAULT_VIEW

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored === 'table' ? 'table' : 'chart'
    } catch {
      // localStorage might be blocked or unavailable
      return DEFAULT_VIEW
    }
  })

  // Persist to localStorage whenever view changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, view)
    } catch {
      // Ignore if localStorage is unavailable
    }
  }, [view])

  return [view, setView] as const
}

/**
 * Clear stored view preference.
 * Useful for testing or resetting user preferences.
 */
export function clearViewPreference(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore if localStorage is unavailable
  }
}
