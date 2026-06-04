/**
 * Period Helper Functions for Dashboard Period State Management
 * Story 60.1-FE: Period State Management
 *
 * Pure utility functions for period calculations, formatting, and conversions.
 * Uses date-fns with Russian locale for all date formatting.
 *
 * @see docs/stories/epic-60/story-60.1-fe-period-state-management.md
 */

import {
  startOfISOWeek,
  endOfISOWeek,
  startOfMonth,
  endOfMonth,
  format,
  parse,
  subWeeks,
  subMonths,
  getISOWeek,
  getISOWeekYear,
  eachWeekOfInterval,
  setISOWeek,
  setISOWeekYear,
} from 'date-fns'
import { nowInMoscow } from './margin-helpers'

/** Period type for week/month toggle */
export type PeriodType = 'week' | 'month'

/** Regex pattern for ISO week format YYYY-Www */
const WEEK_REGEX = /^(\d{4})-W(\d{2})$/

/** Regex pattern for month format YYYY-MM */
const MONTH_REGEX = /^(\d{4})-(\d{2})$/

// Re-export formatting and validation from extracted module
export {
  isCurrentWeek,
  formatWeekLabel,
  isCurrentMonth,
  formatMonthLabel,
  formatPeriodDisplay,
  isValidWeekFormat,
  isValidMonthFormat,
} from './period-helpers-format'

/** Parse ISO week string to Date (Monday of that week) */
export function parseWeek(week: string): Date {
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

  let date = new Date(year, 0, 4)
  date = setISOWeekYear(date, year)
  date = setISOWeek(date, weekNum)
  return startOfISOWeek(date)
}

/** Parse month string to Date (first day of that month) */
export function parseMonth(month: string): Date {
  const match = month.match(MONTH_REGEX)
  if (!match) {
    throw new Error(`Invalid month format: ${month}. Expected YYYY-MM`)
  }
  const [, , monthStr] = match
  const monthNum = parseInt(monthStr, 10)

  if (monthNum < 1 || monthNum > 12) {
    throw new Error(`Invalid month number: ${monthNum}. Must be 1-12`)
  }

  return parse(month, 'yyyy-MM', new Date())
}

/** Get start date (Monday) for an ISO week */
export function getWeekStartDate(week: string): Date {
  return parseWeek(week)
}

/** Get end date (Sunday) for an ISO week */
export function getWeekEndDate(week: string): Date {
  return endOfISOWeek(parseWeek(week))
}

/** Get start date (1st) for a month */
export function getMonthStartDate(month: string): Date {
  return startOfMonth(parseMonth(month))
}

/** Get end date (last day) for a month */
export function getMonthEndDate(month: string): Date {
  return endOfMonth(parseMonth(month))
}

/** Get current ISO week (Europe/Moscow — matches getLastCompletedWeek's anchor, not browser tz) */
export function getCurrentWeek(): string {
  const now = nowInMoscow()
  const weekNum = getISOWeek(now)
  const year = getISOWeekYear(now)
  return `${year}-W${weekNum.toString().padStart(2, '0')}`
}

/** Get previous week */
export function getPreviousWeek(week: string): string {
  const date = parseWeek(week)
  const prevDate = subWeeks(date, 1)
  const weekNum = getISOWeek(prevDate)
  const year = getISOWeekYear(prevDate)
  return `${year}-W${weekNum.toString().padStart(2, '0')}`
}

/** Get current month (Europe/Moscow — consistent with getCurrentWeek's anchor, not browser tz) */
export function getCurrentMonth(): string {
  return format(nowInMoscow(), 'yyyy-MM')
}

/** Get previous month */
export function getPreviousMonth(month: string): string {
  const prevDate = subMonths(parseMonth(month), 1)
  return format(prevDate, 'yyyy-MM')
}

/** Get previous period based on type */
export function getPreviousPeriod(period: string, type: PeriodType): string {
  return type === 'week' ? getPreviousWeek(period) : getPreviousMonth(period)
}

/**
 * Get month containing a week (based on Thursday/midpoint rule)
 * ISO weeks belong to the month where Thursday falls
 */
export function getMonthFromWeek(week: string): string {
  const start = parseWeek(week)
  const thursday = new Date(start)
  thursday.setDate(start.getDate() + 3)
  return format(thursday, 'yyyy-MM')
}

/**
 * Get weeks belonging to a month
 * Returns all weeks where Thursday falls within the month
 */
export function getWeeksInMonth(month: string): string[] {
  const monthStart = getMonthStartDate(month)
  const monthEnd = getMonthEndDate(month)

  const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 })

  return weeks
    .map(weekStart => {
      const weekNum = getISOWeek(weekStart)
      const year = getISOWeekYear(weekStart)
      return `${year}-W${weekNum.toString().padStart(2, '0')}`
    })
    .filter(week => getMonthFromWeek(week) === month)
}
