/**
 * Storage-Specific ISO Week Utilities
 * Request #52: Storage SKU Breakdown for Weekly Reports
 * Extracted from analytics-utils.ts (Story 74.5)
 *
 * Note: These are storage-specific week functions. The general-purpose
 * ISO week module is at @/lib/iso-week-utils (Epic 61).
 */

/**
 * Parse ISO week string to year and week number
 * @param isoWeek - ISO week string (e.g., "2025-W40")
 */
export function parseIsoWeek(isoWeek: string): { year: number; weekNum: number } {
  const match = isoWeek.match(/^(\d{4})-W(\d{1,2})$/)
  if (!match) {
    throw new Error(`Invalid ISO week format: ${isoWeek}`)
  }
  return {
    year: parseInt(match[1], 10),
    weekNum: parseInt(match[2], 10),
  }
}

/**
 * Format year and week number to ISO week string
 * @param year - Year (e.g., 2025)
 * @param weekNum - Week number (1-53)
 */
export function formatIsoWeekString(year: number, weekNum: number): string {
  return `${year}-W${String(weekNum).padStart(2, '0')}`
}

/**
 * Generate array of all ISO weeks between start and end (inclusive)
 * Handles year boundaries correctly.
 *
 * @example
 * generateWeekRange('2025-W40', '2025-W42')
 * // ["2025-W40", "2025-W41", "2025-W42"]
 */
export function generateWeekRange(weekStart: string, weekEnd: string): string[] {
  const start = parseIsoWeek(weekStart)
  const end = parseIsoWeek(weekEnd)

  const weeks: string[] = []
  let currentYear = start.year
  let currentWeek = start.weekNum

  const getMaxWeeks = (year: number): number => {
    const jan1 = new Date(year, 0, 1)
    const dec31 = new Date(year, 11, 31)
    return jan1.getDay() === 4 || dec31.getDay() === 4 ? 53 : 52
  }

  while (currentYear < end.year || (currentYear === end.year && currentWeek <= end.weekNum)) {
    weeks.push(formatIsoWeekString(currentYear, currentWeek))

    currentWeek++
    const maxWeeks = getMaxWeeks(currentYear)
    if (currentWeek > maxWeeks) {
      currentWeek = 1
      currentYear++
    }
  }

  return weeks
}

/**
 * Fill missing weeks in trend data with null values
 * Ensures all weeks in the range are represented for proper chart display.
 *
 * @example
 * fillMissingWeeks(
 *   [{ week: '2025-W46', storage_cost: 1800 }],
 *   '2025-W44',
 *   '2025-W48'
 * )
 */
export function fillMissingWeeks<T extends { week: string }>(
  data: T[],
  weekStart: string,
  weekEnd: string
): (T | { week: string; storage_cost: null; volume: null })[] {
  const allWeeks = generateWeekRange(weekStart, weekEnd)
  const dataMap = new Map(data.map(item => [item.week, item]))

  return allWeeks.map(week => {
    const existing = dataMap.get(week)
    if (existing) {
      return existing
    }
    return {
      week,
      storage_cost: null,
      volume: null,
    }
  })
}

/** Date range result from ISO week conversion */
export interface WeekDateRange {
  /** Start date (YYYY-MM-DD) - Monday of the week */
  dateFrom: string
  /** End date (YYYY-MM-DD) - Sunday of the week */
  dateTo: string
}

/**
 * Convert ISO week to date range for Paid Storage API
 * ISO week: Monday-Sunday, e.g. "2025-W49" = Dec 1-7, 2025
 *
 * Request #52: Required for joining weekly_payout_summary with paid_storage_daily
 *
 * @example
 * getWeekDateRange('2025-W49')
 * // { dateFrom: "2025-12-01", dateTo: "2025-12-07" }
 */
export function getWeekDateRange(isoWeek: string): WeekDateRange {
  const match = isoWeek.match(/^(\d{4})-W(\d{1,2})$/)
  if (!match) {
    throw new Error(
      `Invalid ISO week format: ${isoWeek}. Expected format: YYYY-WNN (e.g., 2025-W49)`
    )
  }

  const year = parseInt(match[1], 10)
  const weekNum = parseInt(match[2], 10)

  if (weekNum < 1 || weekNum > 53) {
    throw new Error(`Invalid week number: ${weekNum}. Must be between 1 and 53`)
  }

  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const firstMonday = new Date(jan4)
  firstMonday.setDate(jan4.getDate() - dayOfWeek + 1)

  const weekStart = new Date(firstMonday)
  weekStart.setDate(firstMonday.getDate() + (weekNum - 1) * 7)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  /** Format Date as YYYY-MM-DD in local timezone (avoids UTC shift from toISOString) */
  const toLocal = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  return {
    dateFrom: toLocal(weekStart),
    dateTo: toLocal(weekEnd),
  }
}
