/**
 * ISO Week Range Functions
 * Story 61.7-FE: Unify ISO Week Calculation Logic
 *
 * Functions for working with date ranges and week ranges:
 * - isoWeekToDateRange - Get date range for a week
 * - getWeekStartDate - Get Monday of a week
 * - getWeekEndDate - Get Sunday of a week
 * - getWeekMidpoint - Get Thursday (COGS temporal lookup)
 * - buildPeriodRange - Build range string from weeks array
 * - parseIsoWeekRange - Parse range string to weeks array
 *
 * @see docs/stories/epic-61/story-61.7-fe-unified-iso-week.md
 */

import { endOfISOWeek, addWeeks, format } from 'date-fns'
import { ISO_WEEK_REGEX, parseIsoWeek, formatIsoWeekString } from './core'
import { generateWeekSequence } from './navigation'

/** Regex pattern for ISO week range (same year): YYYY-Www:Www */
const ISO_WEEK_RANGE_SHORT_REGEX = /^(\d{4})-W(\d{2}):W(\d{2})$/

/** Regex pattern for ISO week range (cross-year): YYYY-Www:YYYY-Www */
const ISO_WEEK_RANGE_FULL_REGEX = /^(\d{4})-W(\d{2}):(\d{4})-W(\d{2})$/

/**
 * Get date range (Monday-Sunday) for an ISO week
 * @param week - ISO week string
 * @returns Object with from (Monday) and to (Sunday) dates as ISO strings
 */
export function isoWeekToDateRange(week: string): { from: string; to: string } {
  const monday = parseIsoWeek(week)
  const sunday = endOfISOWeek(monday)

  return {
    from: format(monday, 'yyyy-MM-dd'),
    to: format(sunday, 'yyyy-MM-dd'),
  }
}

/**
 * Get start date (Monday) for an ISO week
 * @param week - ISO week string
 * @returns Date object for Monday of that week
 */
export function getWeekStartDate(week: string): Date {
  return parseIsoWeek(week)
}

/**
 * Get end date (Sunday) for an ISO week
 * @param week - ISO week string
 * @returns Date object for Sunday of that week
 */
export function getWeekEndDate(week: string): Date {
  return endOfISOWeek(parseIsoWeek(week))
}

/**
 * Get midpoint (Thursday) for an ISO week
 * Used for COGS temporal lookup (week membership determined by Thursday)
 * @param week - ISO week string
 * @returns Date object for Thursday of that week
 */
export function getWeekMidpoint(week: string): Date {
  const monday = parseIsoWeek(week)
  const thursday = addWeeks(monday, 0) // Clone
  thursday.setDate(monday.getDate() + 3) // Thursday = Monday + 3
  thursday.setHours(23, 59, 59, 999) // End of Thursday
  return thursday
}

/**
 * Build ISO week range string from array of weeks
 * @param weeks - Array of ISO week strings (must be sorted chronologically)
 * @returns Range string (e.g., "2026-W01:W05" or "2025-W49:2026-W04")
 */
export function buildPeriodRange(weeks: string[]): string {
  if (weeks.length === 0) return ''
  if (weeks.length === 1) return weeks[0]

  const first = weeks[0]
  const last = weeks[weeks.length - 1]

  // Parse years
  const firstMatch = first.match(ISO_WEEK_REGEX)
  const lastMatch = last.match(ISO_WEEK_REGEX)

  if (!firstMatch || !lastMatch) {
    throw new Error('Invalid week format in array')
  }

  const firstYear = firstMatch[1]
  const lastYear = lastMatch[1]
  const lastWeekNum = lastMatch[2]

  // Same year: short format
  if (firstYear === lastYear) {
    return `${first}:W${lastWeekNum}`
  }

  // Different years: full format
  return `${first}:${last}`
}

/**
 * Parse ISO week range string to array of weeks
 * @param range - Range string (e.g., "2026-W01:W05" or "2025-W49:2026-W04")
 * @returns Array of ISO week strings
 */
export function parseIsoWeekRange(range: string): string[] {
  // Check for single week
  if (ISO_WEEK_REGEX.test(range)) {
    return [range]
  }

  // Parse short format (same year)
  const shortMatch = range.match(ISO_WEEK_RANGE_SHORT_REGEX)
  if (shortMatch) {
    const [, year, startWeek, endWeek] = shortMatch
    return generateWeekSequence(
      formatIsoWeekString(parseInt(year), parseInt(startWeek)),
      formatIsoWeekString(parseInt(year), parseInt(endWeek))
    )
  }

  // Parse full format (cross-year)
  const fullMatch = range.match(ISO_WEEK_RANGE_FULL_REGEX)
  if (fullMatch) {
    const [, startYear, startWeek, endYear, endWeek] = fullMatch
    return generateWeekSequence(
      formatIsoWeekString(parseInt(startYear), parseInt(startWeek)),
      formatIsoWeekString(parseInt(endYear), parseInt(endWeek))
    )
  }

  throw new Error(`Invalid ISO week range format: ${range}`)
}
