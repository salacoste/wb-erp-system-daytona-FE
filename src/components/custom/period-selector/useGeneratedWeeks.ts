/**
 * Generated Weeks Hook
 * Story 60.2-FE: Period Selector Component
 * Story 61.11-FE: Fix 53-Week Year Handling
 *
 * Generates recent weeks based on selected week.
 * Temporary solution until availableWeeks comes from API/context.
 *
 * @see docs/stories/epic-61/story-61.11-fe-53-week-year-handling.md
 */

import { useEffect, useState } from 'react'
import { getISOWeeksInYear } from 'date-fns'

/**
 * Get the number of ISO weeks in a given year.
 * Uses date-fns getISOWeeksInYear for accurate calculation.
 *
 * ISO years can have 52 or 53 weeks. 53-week years include:
 * 2020, 2026, 2032, 2037, 2043, 2048, etc.
 *
 * @param year - The year to check
 * @returns 52 or 53
 */
export function getIsoWeeksInYear(year: number): number {
  // getISOWeeksInYear requires a Date object
  return getISOWeeksInYear(new Date(year, 0, 1))
}

/**
 * Generate recent weeks based on selected week
 * @param selectedWeek - Currently selected week in "YYYY-Www" format
 * @returns Array of week strings going back from selected week
 */
export function useGeneratedWeeks(selectedWeek: string): string[] {
  const [weeks, setWeeks] = useState<string[]>([])

  useEffect(() => {
    const generated: string[] = []
    const match = selectedWeek.match(/^(\d{4})-W(\d{2})$/)
    if (!match) {
      setWeeks([selectedWeek])
      return
    }

    let year = parseInt(match[1], 10)
    let weekNum = parseInt(match[2], 10)

    // Generate 12 weeks going back from selected week
    for (let i = 0; i < 12; i++) {
      generated.push(`${year}-W${weekNum.toString().padStart(2, '0')}`)
      weekNum--
      if (weekNum < 1) {
        year--
        // Story 61.11-FE: Use dynamic week count instead of hardcoded 52
        weekNum = getIsoWeeksInYear(year)
      }
    }

    setWeeks(generated)
  }, [selectedWeek])

  return weeks
}

export default useGeneratedWeeks
