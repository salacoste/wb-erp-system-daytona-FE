/**
 * Period Formatting and Validation Utilities
 * Story 60.1-FE: Period State Management
 *
 * Extracted from period-helpers.ts for file size compliance.
 * Contains formatting functions for week/month labels and validation.
 *
 * @see docs/stories/epic-60/story-60.1-fe-period-state-management.md
 */

import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

import {
  type PeriodType,
  parseMonth,
  getWeekStartDate,
  getWeekEndDate,
  getCurrentWeek,
  getCurrentMonth,
} from './period-helpers'

/** Regex pattern for ISO week format YYYY-Www */
const WEEK_REGEX = /^(\d{4})-W(\d{2})$/

/** Regex pattern for month format YYYY-MM */
const MONTH_REGEX = /^(\d{4})-(\d{2})$/

/** Check if a week is the current (incomplete) week */
export function isCurrentWeek(week: string): boolean {
  return week === getCurrentWeek()
}

/** Format week for display with Russian locale */
export function formatWeekLabel(week: string): string {
  const match = week.match(WEEK_REGEX)
  if (!match) throw new Error(`Invalid week format: ${week}`)

  const [, yearStr, weekStr] = match
  const weekNum = parseInt(weekStr, 10)
  const start = getWeekStartDate(week)
  const end = getWeekEndDate(week)

  const startStr = format(start, 'd MMM', { locale: ru })
  const endStr = format(end, 'd MMM', { locale: ru })

  // Mark current (incomplete) week with indicator
  const currentIndicator = isCurrentWeek(week) ? ' ⏳' : ''
  return `Неделя ${weekNum}, ${yearStr} (${startStr} — ${endStr})${currentIndicator}`
}

/** Check if a month is the current (incomplete) month */
export function isCurrentMonth(month: string): boolean {
  return month === getCurrentMonth()
}

/** Format month for display with Russian locale */
export function formatMonthLabel(month: string): string {
  const date = parseMonth(month)
  const formatted = format(date, 'LLLL yyyy', { locale: ru })
  const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1)
  // Mark current (incomplete) month with indicator
  const currentIndicator = isCurrentMonth(month) ? ' ⏳' : ''
  return `${capitalized}${currentIndicator}`
}

/** Format period for display based on type */
export function formatPeriodDisplay(period: string, type: PeriodType): string {
  return type === 'week' ? formatWeekLabel(period) : formatMonthLabel(period)
}

/** Validate week format */
export function isValidWeekFormat(week: string): boolean {
  return WEEK_REGEX.test(week)
}

/** Validate month format */
export function isValidMonthFormat(month: string): boolean {
  return MONTH_REGEX.test(month)
}
