/**
 * Helper functions for margin recalculation polling
 * Story 4.8: Margin Recalculation Polling & Real-time Updates
 * Request #14 Frontend Integration
 */

import { formatIsoWeek } from './utils'

/**
 * Returns a Date whose LOCAL fields (getDay/getHours/getDate/getFullYear) reflect the current
 * Europe/Moscow wall-clock, regardless of the browser's timezone.
 *
 * The last-completed-week rule (day-of-week + the 12:00 cutoff) is defined in Moscow time to match
 * the backend IsoWeekService. Reading now.getDay()/getHours() in the BROWSER's local tz silently
 * picks the wrong week boundary for any non-Moscow user (e.g. at Tue 11:30 MSK the backend says W-2,
 * but a Yekaterinburg client at local 13:30 would compute W-1) — desyncing the COGS-version
 * applicability warning, the manual-recalc target, and every dashboard widget that derives its
 * target week from getLastCompletedWeek. Moscow is permanently UTC+3 (Russia abolished DST in 2014),
 * so a fixed +3h shift is exact.
 */
// Exported so period-helpers' getCurrentWeek/getCurrentMonth share the same Moscow anchor as
// getLastCompletedWeek — otherwise "current week/month" used local tz, desyncing the period selector.
export function nowInMoscow(): Date {
  const now = new Date()
  // Shift the UTC instant by +3h, then read its UTC fields (= Moscow wall-clock) and rebuild as a
  // LOCAL date so downstream getDay()/getHours()/setDate()/formatIsoWeek all operate on Moscow time.
  const shifted = new Date(now.getTime() + 3 * 60 * 60 * 1000)
  return new Date(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
    shifted.getUTCHours(),
    shifted.getUTCMinutes(),
    shifted.getUTCSeconds(),
    shifted.getUTCMilliseconds()
  )
}

/**
 * Calculate the last completed week based on day of week and time
 * Backend uses this week for margin calculation in product list
 * because current week is not yet completed (report forms at week end)
 *
 * Logic (matching backend IsoWeekService.getLastCompletedWeek(conservative: true)),
 * evaluated in Europe/Moscow time (see nowInMoscow):
 * - Monday: W-2 (2 weeks ago, data not ready)
 * - Tuesday before 12:00 MSK: W-2 (conservative, data may not be ready)
 * - Tuesday after 12:00 MSK: W-1 (past week, data should be ready)
 * - Wednesday-Sunday: W-1 (past week, data should be ready)
 *
 * @returns ISO week string for last completed week (e.g., "2025-W46")
 */
export function getLastCompletedWeek(): string {
  const now = nowInMoscow()
  const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday (Moscow)
  const hours = now.getHours() // Moscow hour

  // Monday (1) or Tuesday (2) before 12:00 → use 2 weeks ago
  if (dayOfWeek === 1 || (dayOfWeek === 2 && hours < 12)) {
    const twoWeeksAgo = new Date(now)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    return formatIsoWeek(twoWeeksAgo)
  }

  // Tuesday after 12:00 or Wednesday-Sunday → use 1 week ago
  const oneWeekAgo = new Date(now)
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  return formatIsoWeek(oneWeekAgo)
}

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
 * Get the midpoint (Thursday) of an ISO week
 * Backend uses week midpoint for COGS temporal lookup
 * See CLAUDE.md: "COGS Temporal Lookup - Week Midpoint Strategy"
 *
 * @param isoWeek - ISO week string (e.g., "2025-W47")
 * @returns Date object for Thursday of that week
 */
export function getWeekMidpointDate(isoWeek: string): Date {
  // Get week start (Monday)
  const weekEnd = getWeekEndDate(isoWeek)
  // Midpoint is Thursday = Sunday - 3 days
  const midpoint = new Date(weekEnd.getTime())
  midpoint.setDate(weekEnd.getDate() - 3)
  midpoint.setHours(23, 59, 59, 999) // End of Thursday
  return midpoint
}

/**
 * Check if COGS valid_from date is after the last completed week's midpoint
 * If true, margin won't be available for last completed week because
 * backend uses week midpoint (Thursday) for COGS temporal lookup.
 *
 * See CLAUDE.md: "COGS Temporal Lookup - Week Midpoint Strategy"
 * - If validFrom ≤ Thursday (midpoint) → New COGS applies to that week
 * - If validFrom > Thursday (midpoint) → Old COGS remains for that week
 *
 * Uses getLastCompletedWeek() to determine the last completed week
 * (matching backend logic for day of week and time)
 *
 * @param validFrom - COGS valid_from date (ISO string or Date)
 * @returns true if COGS won't apply to last completed week due to midpoint rule
 */
export function isCogsAfterLastCompletedWeek(validFrom: string | Date): boolean {
  // Handle both ISO date strings (2025-11-24T00:00:00.000Z) and date-only strings (2025-11-24)
  let cogsDate: Date
  if (typeof validFrom === 'string') {
    // If it's already an ISO string with time, use it directly
    // Otherwise, add T00:00:00 for date-only strings
    cogsDate = validFrom.includes('T') ? new Date(validFrom) : new Date(validFrom + 'T00:00:00')
  } else {
    cogsDate = validFrom
  }

  const lastCompletedWeek = getLastCompletedWeek()
  // Use week midpoint (Thursday) instead of week end (Sunday) to match backend logic
  const lastCompletedWeekMidpoint = getWeekMidpointDate(lastCompletedWeek)

  return cogsDate > lastCompletedWeekMidpoint
}

// Re-export polling helpers for backward compatibility (Epic 74 extraction)
export {
  type PollingConfig,
  estimateCalculationTime,
  getPollingStrategy,
} from './margin-polling-helpers'

/**
 * Calculate affected weeks from valid_from date to last completed week
 * Returns array of ISO week strings (e.g., ["2025-W41", "2025-W42", ...])
 *
 * IMPORTANT: Uses last completed week (not current week) to avoid including
 * weeks without data. Backend processes margin calculation only for completed weeks.
 *
 * Uses Europe/Moscow timezone logic (consistent with backend Epic 20)
 * If validFrom is after last completed week, returns empty array
 *
 * @param validFrom - ISO date string (YYYY-MM-DD) or Date object
 * @returns Array of ISO week strings
 */
export function calculateAffectedWeeks(validFrom: string | Date): string[] {
  const startDate = typeof validFrom === 'string' ? new Date(validFrom + 'T00:00:00') : validFrom

  // Get last completed week (not current week) to avoid weeks without data
  const lastCompletedWeek = getLastCompletedWeek()
  const lastCompletedWeekEnd = getWeekEndDate(lastCompletedWeek)

  // If validFrom is after last completed week, return empty array
  // (no completed weeks to recalculate)
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
