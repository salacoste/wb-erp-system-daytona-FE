/**
 * ISO Week Period Presets
 * Story 61.6-FE: Fix Period Presets to ISO Weeks
 *
 * ISO week-based period preset calculations.
 */

import {
  getCurrentIsoWeek,
  buildPeriodRange,
  getSameWeekPreviousYear,
  dateToIsoWeek,
} from '@/lib/iso-week-utils'
import type { PresetPeriods, PresetPeriodsWithMeta } from '@/types/analytics-comparison'
import type { PeriodRange, ComparisonPreset } from './types'

/**
 * Get ISO weeks that belong to a calendar month
 * Uses Thursday rule: week belongs to month where Thursday falls
 */
export function getWeeksInCalendarMonth(year: number, month: number): string[] {
  const weeks: string[] = []
  const seen = new Set<string>()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const current = new Date(firstDay)
  while (current <= lastDay) {
    const week = dateToIsoWeek(current)
    if (!seen.has(week)) {
      const thursday = getThursdayOfWeek(week)
      if (thursday.getMonth() === month && thursday.getFullYear() === year) {
        seen.add(week)
        weeks.push(week)
      }
    }
    current.setDate(current.getDate() + 1)
  }

  return weeks.sort()
}

/** Get Thursday of an ISO week (used for week membership determination) */
function getThursdayOfWeek(week: string): Date {
  const match = week.match(/^(\d{4})-W(\d{2})$/)
  if (!match) throw new Error(`Invalid week: ${week}`)

  const [, yearStr, weekStr] = match
  const year = parseInt(yearStr, 10)
  const weekNum = parseInt(weekStr, 10)

  const jan4 = new Date(year, 0, 4)
  const jan4Day = jan4.getDay() || 7

  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - jan4Day + 1 + (weekNum - 1) * 7)

  const thursday = new Date(monday)
  thursday.setDate(monday.getDate() + 3)

  return thursday
}

/**
 * Get ISO weeks for a calendar quarter
 */
export function getWeeksInQuarter(year: number, quarter: number): string[] {
  if (quarter < 1 || quarter > 4) {
    throw new Error(`Invalid quarter: ${quarter}. Must be 1-4`)
  }

  const startMonth = (quarter - 1) * 3
  const weeks: string[] = []

  for (let m = 0; m < 3; m++) {
    const monthWeeks = getWeeksInCalendarMonth(year, startMonth + m)
    for (const week of monthWeeks) {
      if (!weeks.includes(week)) {
        weeks.push(week)
      }
    }
  }

  return weeks.sort()
}

/** Convert month to ISO week range string */
export function monthToIsoWeekRange(year: number, month: number): string {
  const weeks = getWeeksInCalendarMonth(year, month)
  return buildPeriodRange(weeks)
}

/** Convert quarter to ISO week range string */
export function quarterToIsoWeekRange(year: number, quarter: number): string {
  const weeks = getWeeksInQuarter(year, quarter)
  return buildPeriodRange(weeks)
}

/** Get Month-over-Month preset in ISO week format */
export function getMoMPreset(): PresetPeriods {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear

  return {
    period1: monthToIsoWeekRange(prevYear, prevMonth),
    period2: monthToIsoWeekRange(currentYear, currentMonth),
  }
}

/** Get Quarter-over-Quarter preset in ISO week format */
export function getQoQPreset(): PresetPeriods {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()
  const currentQuarter = Math.floor(currentMonth / 3) + 1

  const prevQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1
  const prevYear = currentQuarter === 1 ? currentYear - 1 : currentYear

  return {
    period1: quarterToIsoWeekRange(prevYear, prevQuarter),
    period2: quarterToIsoWeekRange(currentYear, currentQuarter),
  }
}

/** Get Year-over-Year preset in ISO week format */
export function getYoYPreset(): PresetPeriodsWithMeta {
  const currentWeek = getCurrentIsoWeek()
  const { week: prevYearWeek, weekMismatch } = getSameWeekPreviousYear(currentWeek)

  return {
    period1: prevYearWeek,
    period2: currentWeek,
    weekMismatch,
  }
}

/** Calculate ISO week preset periods - unified function */
export function calculateIsoWeekPresetPeriods(preset: ComparisonPreset): PresetPeriodsWithMeta {
  switch (preset) {
    case 'mom':
      return getMoMPreset()
    case 'qoq':
      return getQoQPreset()
    case 'yoy':
      return getYoYPreset()
    case 'custom':
    default:
      return { period1: '', period2: '' }
  }
}

/** Convert legacy date range to ISO week range */
export function dateRangeToIsoWeekRange(range: PeriodRange): string {
  const fromWeek = dateToIsoWeek(range.from)
  const toWeek = dateToIsoWeek(range.to)

  if (fromWeek === toWeek) {
    return fromWeek
  }

  return buildPeriodRange([fromWeek, toWeek])
}
