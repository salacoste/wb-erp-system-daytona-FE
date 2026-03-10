/**
 * Week string helpers for DashboardPeriodSelector
 * Extracted from DashboardPeriodSelector.tsx for file size compliance
 */

import { getCurrentWeek } from '@/lib/period-helpers'

/**
 * Parse week string to get year and week number
 * @param week - Week in "YYYY-Www" format
 */
export function parseWeekString(week: string): { year: number; week: number } | null {
  const match = week.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return null
  return { year: parseInt(match[1], 10), week: parseInt(match[2], 10) }
}

/** Generate week string from year and week number */
export function formatWeekString(year: number, week: number): string {
  return `${year}-W${week.toString().padStart(2, '0')}`
}

/** Check if year is a leap year */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/**
 * Ensure all weeks from current week down to the first week in list are included.
 * This fixes the bug where Week 5 was missing between Week 6 (current) and Week 4 (selected).
 *
 * BUG FIX: When selectedWeek is older than currentWeek, we need to fill the gap.
 * Example: currentWeek=W06, list=[W04, W03, W02...] -> result=[W06, W05, W04, W03, W02...]
 */
export function ensureCurrentWeekFirst(weeks: string[]): string[] {
  if (weeks.length === 0) return weeks

  const currentWeek = getCurrentWeek()
  const current = parseWeekString(currentWeek)
  const firstInList = parseWeekString(weeks[0])

  if (!current || !firstInList) {
    const filtered = weeks.filter(w => w !== currentWeek)
    return [currentWeek, ...filtered]
  }

  const result: string[] = []
  let year = current.year
  let weekNum = current.week

  const endYear = firstInList.year
  const endWeek = firstInList.week

  while (year > endYear || (year === endYear && weekNum >= endWeek)) {
    result.push(formatWeekString(year, weekNum))
    weekNum--
    if (weekNum < 1) {
      year--
      const jan4 = new Date(year, 0, 4)
      const dayOfWeek = jan4.getDay() || 7
      const hasWeek53 = dayOfWeek === 4 || (dayOfWeek === 5 && isLeapYear(year - 1))
      weekNum = hasWeek53 ? 53 : 52
    }
    if (result.length > 60) break
  }

  const resultSet = new Set(result)
  for (const week of weeks) {
    if (!resultSet.has(week)) {
      result.push(week)
    }
  }

  return result
}
