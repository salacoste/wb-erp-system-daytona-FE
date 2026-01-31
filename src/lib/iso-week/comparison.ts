/**
 * ISO Week Comparison Functions
 * Story 61.7-FE: Unify ISO Week Calculation Logic
 *
 * Functions for comparing weeks:
 * - compareIsoWeeks - Compare two weeks
 * - getSameWeekPreviousYear - Get same week from previous year
 * - isValidIsoWeekFormat - Validate week string format
 * - isValidIsoWeekRangeFormat - Validate range format
 *
 * @see docs/stories/epic-61/story-61.7-fe-unified-iso-week.md
 */

import { ISO_WEEK_REGEX, parseIsoWeek, formatIsoWeekString, getIsoWeeksInYear } from './core'

/** Regex pattern for ISO week range (same year): YYYY-Www:Www */
const ISO_WEEK_RANGE_SHORT_REGEX = /^(\d{4})-W(\d{2}):W(\d{2})$/

/** Regex pattern for ISO week range (cross-year): YYYY-Www:YYYY-Www */
const ISO_WEEK_RANGE_FULL_REGEX = /^(\d{4})-W(\d{2}):(\d{4})-W(\d{2})$/

/**
 * Validate ISO week format
 * @param week - String to validate
 * @returns true if valid YYYY-Www format
 */
export function isValidIsoWeekFormat(week: string): boolean {
  if (!ISO_WEEK_REGEX.test(week)) return false

  try {
    parseIsoWeek(week) // Also validates week number against year
    return true
  } catch {
    return false
  }
}

/**
 * Validate ISO week range format
 * Supports both short (2026-W01:W05) and full (2025-W49:2026-W04) formats
 * @param range - String to validate
 * @returns true if valid range format
 */
export function isValidIsoWeekRangeFormat(range: string): boolean {
  return ISO_WEEK_RANGE_SHORT_REGEX.test(range) || ISO_WEEK_RANGE_FULL_REGEX.test(range)
}

/**
 * Compare two ISO weeks
 * @param week1 - First week
 * @param week2 - Second week
 * @returns -1 if week1 < week2, 0 if equal, 1 if week1 > week2
 */
export function compareIsoWeeks(week1: string, week2: string): -1 | 0 | 1 {
  if (week1 === week2) return 0
  return week1 < week2 ? -1 : 1
}

/**
 * Get the same week number from previous year
 * Handles W53 edge case (falls back to W52 if target year has only 52 weeks)
 * @param week - Source week
 * @returns Week from previous year
 */
export function getSameWeekPreviousYear(week: string): {
  week: string
  weekMismatch: boolean
} {
  const match = week.match(ISO_WEEK_REGEX)
  if (!match) throw new Error(`Invalid ISO week format: ${week}`)

  const [, yearStr, weekStr] = match
  const year = parseInt(yearStr, 10)
  const weekNum = parseInt(weekStr, 10)
  const prevYear = year - 1

  const prevYearWeeks = getIsoWeeksInYear(prevYear)

  // Handle W53 edge case
  if (weekNum > prevYearWeeks) {
    return {
      week: formatIsoWeekString(prevYear, prevYearWeeks),
      weekMismatch: true,
    }
  }

  return {
    week: formatIsoWeekString(prevYear, weekNum),
    weekMismatch: false,
  }
}
