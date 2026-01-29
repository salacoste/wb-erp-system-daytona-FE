/**
 * Period Selector Utilities
 * Story 60.2-FE: Period Selector Component
 *
 * Utility functions for the period selector component.
 */

import { getMonthFromWeek } from '@/lib/period-helpers'

/** Maximum number of weeks to show in dropdown */
export const MAX_WEEKS = 12

/** Maximum number of months to show in dropdown */
export const MAX_MONTHS = 6

/**
 * Extract unique months from available weeks (most recent first)
 * @param weeks - Array of week strings in "YYYY-Www" format
 * @returns Array of unique month strings in "YYYY-MM" format, sorted descending
 */
export function getUniqueMonths(weeks: string[]): string[] {
  const months = new Set<string>()
  weeks.forEach(week => {
    try {
      const month = getMonthFromWeek(week)
      months.add(month)
    } catch {
      // Skip invalid weeks
    }
  })
  return Array.from(months).sort().reverse()
}
