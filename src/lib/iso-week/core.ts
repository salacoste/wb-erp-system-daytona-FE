/**
 * ISO Week Core Functions
 * Story 61.7-FE: Unify ISO Week Calculation Logic
 *
 * Core ISO week calculation functions:
 * - getCurrentIsoWeek - Get current week in YYYY-Www format
 * - formatIsoWeekString - Format year/week to string
 * - parseIsoWeek - Parse week string to Date
 * - dateToIsoWeek - Convert Date to week string
 * - getIsoWeeksInYear - Get number of weeks in a year
 *
 * @see docs/stories/epic-61/story-61.7-fe-unified-iso-week.md
 */

import {
  getISOWeek,
  getISOWeekYear,
  getISOWeeksInYear,
  startOfISOWeek,
  setISOWeek,
  setISOWeekYear,
  isValid,
} from 'date-fns'

/** Regex pattern for ISO week format YYYY-Www */
export const ISO_WEEK_REGEX = /^(\d{4})-W(\d{2})$/

/**
 * Get current ISO week in YYYY-Www format
 * Uses system time or optional date parameter
 *
 * @param options.date - Optional date to get week for (default: now)
 * @returns ISO week string (e.g., "2026-W05")
 */
export function getCurrentIsoWeek(options?: { date?: Date }): string {
  const date = options?.date ?? new Date()
  const weekNum = getISOWeek(date)
  const year = getISOWeekYear(date)
  return formatIsoWeekString(year, weekNum)
}

/**
 * Format year and week number to ISO week string
 * @param year - ISO week year
 * @param week - Week number (1-53)
 * @returns ISO week string (e.g., "2026-W05")
 */
export function formatIsoWeekString(year: number, week: number): string {
  return `${year}-W${week.toString().padStart(2, '0')}`
}

/**
 * Parse ISO week string to Date (Monday of that week)
 * @param week - Week in "YYYY-Www" format
 * @returns Date object for Monday of that week
 * @throws Error if invalid format or week number
 */
export function parseIsoWeek(week: string): Date {
  const match = week.match(ISO_WEEK_REGEX)
  if (!match) {
    throw new Error(`Invalid ISO week format: ${week}. Expected YYYY-Www`)
  }

  const [, yearStr, weekStr] = match
  const year = parseInt(yearStr, 10)
  const weekNum = parseInt(weekStr, 10)

  // Validate week number
  if (weekNum < 1 || weekNum > 53) {
    throw new Error(`Invalid week number: ${weekNum}. Must be 1-53`)
  }

  // Check if year has W53
  const weeksInYear = getIsoWeeksInYear(year)
  if (weekNum > weeksInYear) {
    throw new Error(`Year ${year} has only ${weeksInYear} weeks, but W${weekNum} was requested`)
  }

  // Build date for the target week
  let date = new Date(year, 0, 4) // Jan 4 is always in W01
  date = setISOWeekYear(date, year)
  date = setISOWeek(date, weekNum)
  return startOfISOWeek(date)
}

/**
 * Convert Date to ISO week string
 * @param date - Date object or ISO date string
 * @returns ISO week string (e.g., "2026-W05")
 * @throws Error if invalid date
 */
export function dateToIsoWeek(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (!isValid(dateObj)) {
    throw new Error(`Invalid date: ${date}`)
  }

  const weekNum = getISOWeek(dateObj)
  const year = getISOWeekYear(dateObj)
  return formatIsoWeekString(year, weekNum)
}

/**
 * Get number of ISO weeks in a year
 * @param year - Calendar year
 * @returns Number of weeks (52 or 53)
 */
export function getIsoWeeksInYear(year: number): number {
  return getISOWeeksInYear(new Date(year, 5, 1)) // Use mid-year date
}
