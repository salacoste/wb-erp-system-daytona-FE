/**
 * Date Utility Functions for Period-to-Date-Range Conversions
 * Story 60.6-FE: Sync Advertising Widget with Global Period
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * Pure utility functions for converting period strings (weeks, months)
 * to date ranges suitable for API calls.
 *
 * @see docs/stories/epic-60/story-60.6-fe-sync-advertising-widget.md
 */

import {
  startOfISOWeek,
  endOfISOWeek,
  startOfMonth,
  endOfMonth,
  format,
  setISOWeek,
  setISOWeekYear,
} from 'date-fns'

/** Date range with ISO date strings */
export interface DateRange {
  /** Start date in YYYY-MM-DD format */
  from: string
  /** End date in YYYY-MM-DD format */
  to: string
}

/** Regex pattern for ISO week format YYYY-Www */
const WEEK_REGEX = /^(\d{4})-W(\d{2})$/

/** Regex pattern for month format YYYY-MM */
const MONTH_REGEX = /^(\d{4})-(\d{2})$/

/**
 * Convert ISO week string to date range for API calls.
 *
 * @param week - ISO week format "YYYY-Www" (e.g., "2026-W05")
 * @returns Date range { from, to } in "YYYY-MM-DD" format
 * @throws Error if invalid week format
 *
 * @example
 * weekToDateRange('2026-W05')
 * // Returns: { from: '2026-01-27', to: '2026-02-02' }
 *
 * @example
 * // Week 1 may start in previous year
 * weekToDateRange('2026-W01')
 * // Returns: { from: '2025-12-29', to: '2026-01-04' }
 */
export function weekToDateRange(week: string): DateRange {
  const match = week.match(WEEK_REGEX)
  if (!match) {
    throw new Error(`Invalid week format: ${week}. Expected YYYY-Www`)
  }

  const [, yearStr, weekStr] = match
  const year = parseInt(yearStr, 10)
  const weekNum = parseInt(weekStr, 10)

  if (weekNum < 1 || weekNum > 53) {
    throw new Error(`Invalid week number: ${weekNum}. Must be 1-53`)
  }

  // Create a date in the target year
  let date = new Date(year, 0, 4) // Jan 4 is always in week 1
  date = setISOWeekYear(date, year)
  date = setISOWeek(date, weekNum)

  const weekStart = startOfISOWeek(date)
  const weekEnd = endOfISOWeek(date)

  return {
    from: format(weekStart, 'yyyy-MM-dd'),
    to: format(weekEnd, 'yyyy-MM-dd'),
  }
}

/**
 * Convert month string to date range for API calls.
 *
 * @param month - Month format "YYYY-MM" (e.g., "2026-01")
 * @returns Date range { from, to } in "YYYY-MM-DD" format
 * @throws Error if invalid month format
 *
 * @example
 * monthToDateRange('2026-01')
 * // Returns: { from: '2026-01-01', to: '2026-01-31' }
 *
 * @example
 * // Leap year February
 * monthToDateRange('2024-02')
 * // Returns: { from: '2024-02-01', to: '2024-02-29' }
 */
export function monthToDateRange(month: string): DateRange {
  const match = month.match(MONTH_REGEX)
  if (!match) {
    throw new Error(`Invalid month format: ${month}. Expected YYYY-MM`)
  }

  const [, yearStr, monthStr] = match
  const year = parseInt(yearStr, 10)
  const monthNum = parseInt(monthStr, 10)

  if (monthNum < 1 || monthNum > 12) {
    throw new Error(`Invalid month number: ${monthNum}. Must be 1-12`)
  }

  // Note: JavaScript months are 0-indexed
  const monthStart = startOfMonth(new Date(year, monthNum - 1, 1))
  const monthEnd = endOfMonth(new Date(year, monthNum - 1, 1))

  return {
    from: format(monthStart, 'yyyy-MM-dd'),
    to: format(monthEnd, 'yyyy-MM-dd'),
  }
}

/**
 * Validate ISO week format
 * @param week - String to validate
 * @returns true if valid YYYY-Www format
 */
export function isValidWeekFormat(week: string): boolean {
  return WEEK_REGEX.test(week)
}

/**
 * Validate month format
 * @param month - String to validate
 * @returns true if valid YYYY-MM format
 */
export function isValidMonthFormat(month: string): boolean {
  return MONTH_REGEX.test(month)
}
