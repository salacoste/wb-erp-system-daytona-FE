/**
 * Orders Volume Period Helpers
 * Extracted from useOrdersVolume.ts for file-size compliance.
 */

import { getISOWeek, getISOWeekYear, subMonths, format } from 'date-fns'

/**
 * Get previous ISO week string
 * Handles year boundary: "2026-W01" -> "2025-W52"
 */
export function getPreviousWeek(week: string): string {
  const match = week.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return week

  const [, yearStr, weekStr] = match
  const year = parseInt(yearStr, 10)
  const weekNum = parseInt(weekStr, 10)

  // If week number is 1, we need to go to previous year's last week
  if (weekNum === 1) {
    const lastYearDec = new Date(year - 1, 11, 28) // Dec 28 is always in last week
    const lastWeek = getISOWeek(lastYearDec)
    const lastWeekYear = getISOWeekYear(lastYearDec)
    return `${lastWeekYear}-W${lastWeek.toString().padStart(2, '0')}`
  }

  return `${year}-W${(weekNum - 1).toString().padStart(2, '0')}`
}

/**
 * Get previous month string
 * Handles year boundary: "2026-01" -> "2025-12"
 */
export function getPreviousMonth(month: string): string {
  const match = month.match(/^(\d{4})-(\d{2})$/)
  if (!match) return month

  const [, yearStr, monthStr] = match
  const year = parseInt(yearStr, 10)
  const monthNum = parseInt(monthStr, 10)

  const date = new Date(year, monthNum - 1, 1)
  const prevDate = subMonths(date, 1)

  return format(prevDate, 'yyyy-MM')
}
