/**
 * Helper functions for margin recalculation polling
 * Story 4.8: Margin Recalculation Polling & Real-time Updates
 * Request #14 Frontend Integration
 *
 * Epic 150: Extracted week calculation helpers to week-calculation-helpers.ts
 * for file size compliance.
 */

import { formatIsoWeek } from './utils'
import {
  isCogsAfterMidpoint,
  calculateAffectedWeeks as calcAffectedWeeks,
} from './week-calculation-helpers'

// Re-export for consumers
export { getWeekEndDate } from './week-calculation-helpers'

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
 * Check if COGS valid_from date is after the last completed week's midpoint
 * If true, margin won't be available for last completed week because
 * backend uses week midpoint (Thursday) for COGS temporal lookup.
 *
 * @param validFrom - COGS valid_from date (ISO string or Date)
 * @returns true if COGS won't apply to last completed week due to midpoint rule
 */
export function isCogsAfterLastCompletedWeek(validFrom: string | Date): boolean {
  return isCogsAfterMidpoint(validFrom, getLastCompletedWeek)
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
 * @param validFrom - ISO date string (YYYY-MM-DD) or Date object
 * @returns Array of ISO week strings
 */
export function calculateAffectedWeeks(validFrom: string | Date): string[] {
  return calcAffectedWeeks(validFrom, getLastCompletedWeek)
}
