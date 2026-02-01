/**
 * Generated Weeks Hook
 * Story 60.2-FE: Period Selector Component
 * Story 61.11-FE: Fix 53-Week Year Handling
 *
 * Generates recent weeks including current week for user selection.
 * Allows users to view both current (incomplete) and completed weeks.
 *
 * @see docs/stories/epic-61/story-61.11-fe-53-week-year-handling.md
 */

import { useEffect, useState } from 'react'
import { getISOWeeksInYear } from 'date-fns'

/**
 * Get the number of ISO weeks in a given year.
 * Uses date-fns getISOWeeksInYear for accurate calculation.
 */
export function getIsoWeeksInYear(year: number): number {
  return getISOWeeksInYear(new Date(year, 0, 1))
}

/**
 * Generate recent weeks starting from selected week
 * @param selectedWeek - Starting week in "YYYY-Www" format
 * @returns Array of week strings starting from selectedWeek and going back
 */
export function useGeneratedWeeks(selectedWeek: string): string[] {
  const [weeks, setWeeks] = useState<string[]>([])

  useEffect(() => {
    const match = selectedWeek.match(/^(\d{4})-W(\d{2})$/)
    if (!match) {
      setWeeks([selectedWeek])
      return
    }

    const generated: string[] = []
    let year = parseInt(match[1], 10)
    let weekNum = parseInt(match[2], 10)

    // Generate 12 weeks starting from selectedWeek and going back
    for (let i = 0; i < 12; i++) {
      generated.push(`${year}-W${weekNum.toString().padStart(2, '0')}`)
      weekNum--
      if (weekNum < 1) {
        year--
        weekNum = getIsoWeeksInYear(year)
      }
    }

    setWeeks(generated)
  }, [selectedWeek])

  return weeks
}

export default useGeneratedWeeks
