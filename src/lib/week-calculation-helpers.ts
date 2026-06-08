/**
 * Week calculation helpers for COGS temporal logic and margin recalculation
 *
 * Extracted from margin-helpers.ts for file size compliance.
 * These functions deal with ISO week date arithmetic.
 */

import { formatIsoWeek } from './utils'

/**
 * Get the end date (Sunday 23:59:59) of an ISO week
 * Used to determine the cutoff date for affected weeks calculation
 *
 * @param isoWeek - ISO week string (e.g., "2025-W46")
 * @returns Date object representing end of week (Sunday 23:59:59)
 */
export function getWeekEndDate(isoWeek: string): Date {
  const match = isoWeek.match(/^(\d{4})-W(\d{2})$/)
  if (!match) {
    throw new Error(`Invalid ISO week format: ${isoWeek}`)
  }

  const [, yearStr, weekStr] = match
  const year = parseInt(yearStr, 10)
  const week = parseInt(weekStr, 10)

  // Calculate first day of year (Jan 4 is always in week 1)
  const jan4 = new Date(year, 0, 4)
  const jan4Day = jan4.getDay() || 7 // Monday = 1, Sunday = 7

  // Calculate Monday of the target week
  const weekStart = new Date(jan4.getTime())
  weekStart.setDate(jan4.getDate() - jan4Day + 1 + (week - 1) * 7)

  // Calculate Sunday (end of week)
  const weekEnd = new Date(weekStart.getTime())
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  return weekEnd
}

/**
 * Check if COGS valid_from date is after the last completed week's midpoint
 * If true, margin won't be available for last completed week because
 * backend uses week midpoint (Thursday) for COGS temporal lookup.
 *
 * See CLAUDE.md: "COGS Temporal Lookup - Week Midpoint Strategy"
 * - If validFrom <= Thursday (midpoint) -> New COGS applies to that week
 * - If validFrom > Thursday (midpoint) -> Old COGS remains for that week
 *
 * @param validFrom - COGS valid_from date (ISO string or Date)
 * @param getLastCompletedWeek - Function returning the last completed week
 * @returns true if COGS won't apply to last completed week due to midpoint rule
 */
export function isCogsAfterMidpoint(
  validFrom: string | Date,
  getLastCompletedWeek: () => string
): boolean {
  // Handle both ISO date strings (2025-11-24T00:00:00.000Z) and date-only strings (2025-11-24)
  let cogsDate: Date
  if (typeof validFrom === 'string') {
    cogsDate = validFrom.includes('T') ? new Date(validFrom) : new Date(validFrom + 'T00:00:00')
  } else {
    cogsDate = validFrom
  }

  const lastCompletedWeek = getLastCompletedWeek()
  // Week midpoint (Thursday) = week end (Sunday) - 3 days
  const weekEnd = getWeekEndDate(lastCompletedWeek)
  const midpoint = new Date(weekEnd.getTime())
  midpoint.setDate(weekEnd.getDate() - 3)
  midpoint.setHours(23, 59, 59, 999)

  return cogsDate > midpoint
}

/**
 * Calculate affected weeks from valid_from date to last completed week
 * Returns array of ISO week strings (e.g., ["2025-W41", "2025-W42", ...])
 *
 * IMPORTANT: Uses last completed week (not current week) to avoid including
 * weeks without data. Backend processes margin calculation only for completed weeks.
 *
 * @param validFrom - ISO date string (YYYY-MM-DD) or Date object
 * @param getLastCompletedWeek - Function returning the last completed week
 * @returns Array of ISO week strings
 */
export function calculateAffectedWeeks(
  validFrom: string | Date,
  getLastCompletedWeek: () => string
): string[] {
  const startDate = typeof validFrom === 'string' ? new Date(validFrom + 'T00:00:00') : validFrom

  // Get last completed week (not current week) to avoid weeks without data
  const lastCompletedWeek = getLastCompletedWeek()
  const lastCompletedWeekEnd = getWeekEndDate(lastCompletedWeek)

  // If validFrom is after last completed week, return empty array
  if (startDate > lastCompletedWeekEnd) {
    return []
  }

  const weeks: string[] = []
  const current = new Date(startDate)

  // Iterate from startDate to last completed week end, adding each week
  while (current <= lastCompletedWeekEnd) {
    const weekStr = formatIsoWeek(current)
    if (!weeks.includes(weekStr)) {
      weeks.push(weekStr)
    }

    // Move to next week (add 7 days)
    current.setDate(current.getDate() + 7)
  }

  return weeks
}
