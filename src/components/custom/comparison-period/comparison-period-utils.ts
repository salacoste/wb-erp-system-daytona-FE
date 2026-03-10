/**
 * Comparison Period Utility Functions
 * Story 6.2-FE: Period Comparison Enhancement
 *
 * Pure calculation helpers for ISO week period arithmetic.
 */

import type { ComparisonPreset } from './comparison-period-types'

/**
 * Parse ISO week format (YYYY-Www) into year and week number
 */
function parseIsoWeek(week: string): { year: number; week: number } {
  const match = week.match(/(\d{4})-W(\d{2})/)
  if (!match) return { year: 2025, week: 1 }
  return { year: parseInt(match[1]), week: parseInt(match[2]) }
}

/**
 * Calculate the previous period based on current period length.
 * E.g., if current is W45-W47 (3 weeks), previous is W42-W44.
 */
export function calculatePreviousPeriod(
  start: string,
  end: string
): { start: string; end: string } {
  const startParsed = parseIsoWeek(start)
  const endParsed = parseIsoWeek(end)

  // Calculate period length in weeks
  const periodLength = endParsed.week - startParsed.week + 1

  // Calculate previous period end (week before current start)
  let prevEndWeek = startParsed.week - 1
  let prevEndYear = startParsed.year
  if (prevEndWeek <= 0) {
    prevEndYear -= 1
    prevEndWeek = 52 + prevEndWeek // Handle year boundary
  }

  // Calculate previous period start
  let prevStartWeek = prevEndWeek - periodLength + 1
  let prevStartYear = prevEndYear
  if (prevStartWeek <= 0) {
    prevStartYear -= 1
    prevStartWeek = 52 + prevStartWeek
  }

  return {
    start: `${prevStartYear}-W${String(prevStartWeek).padStart(2, '0')}`,
    end: `${prevEndYear}-W${String(prevEndWeek).padStart(2, '0')}`,
  }
}

/**
 * Calculate the same period from last year
 */
export function calculateSamePeriodLastYear(
  start: string,
  end: string
): { start: string; end: string } {
  const startParsed = parseIsoWeek(start)
  const endParsed = parseIsoWeek(end)

  return {
    start: `${startParsed.year - 1}-W${String(startParsed.week).padStart(2, '0')}`,
    end: `${endParsed.year - 1}-W${String(endParsed.week).padStart(2, '0')}`,
  }
}

/**
 * Format period for display
 */
export function formatPeriodDisplay(start: string, end: string): string {
  if (start === end) {
    return start
  }
  return `${start} — ${end}`
}

/**
 * Get effective comparison period based on preset and custom values
 */
export function getEffectiveComparisonPeriod(
  preset: ComparisonPreset,
  currentStart: string,
  currentEnd: string,
  customStart: string,
  customEnd: string
): { start: string; end: string } {
  if (preset === 'previous') {
    return calculatePreviousPeriod(currentStart, currentEnd)
  }
  if (preset === 'same_last_year') {
    return calculateSamePeriodLastYear(currentStart, currentEnd)
  }
  return { start: customStart, end: customEnd }
}
