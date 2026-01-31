/**
 * Period Comparison Helper Functions
 * Story 63.11-FE: WoW/MoM Period Comparison Cards
 *
 * Utilities for calculating comparison periods and formatting labels.
 *
 * @see docs/stories/epic-63/story-63.11-fe-period-comparison-cards.md
 */

import { getISOWeek, getISOWeekYear, getMonth, getYear } from 'date-fns'
import { getPreviousIsoWeek, parseIsoWeek, getWeekRange } from '@/lib/iso-week-utils'

export type ComparisonMode = 'wow' | 'mom'

export interface ComparisonPeriods {
  period1: string
  period2: string
}

/** Russian month names for MoM display */
const MONTH_NAMES_RU = [
  'Янв',
  'Фев',
  'Мар',
  'Апр',
  'Май',
  'Июн',
  'Июл',
  'Авг',
  'Сен',
  'Окт',
  'Ноя',
  'Дек',
] as const

/**
 * Get month info from an ISO week string
 * Uses the Thursday of the week to determine the month
 */
function getMonthFromIsoWeek(isoWeek: string): { month: number; year: number } {
  const weekDate = parseIsoWeek(isoWeek)
  // Add 3 days to get to Thursday (parseIsoWeek returns Monday)
  const thursday = new Date(weekDate)
  thursday.setDate(thursday.getDate() + 3)

  return {
    month: getMonth(thursday) + 1, // 1-12
    year: getYear(thursday),
  }
}

/**
 * Get ISO week year and week number from an ISO week string
 */
function extractWeekParts(isoWeek: string): { year: number; week: number } {
  const weekDate = parseIsoWeek(isoWeek)
  return {
    year: getISOWeekYear(weekDate),
    week: getISOWeek(weekDate),
  }
}

/**
 * Calculate comparison periods based on mode
 */
export function getComparisonPeriods(currentWeek: string, mode: ComparisonMode): ComparisonPeriods {
  if (mode === 'wow') {
    return {
      period1: currentWeek,
      period2: getPreviousIsoWeek(currentWeek),
    }
  }

  // MoM: Get weeks from current and previous months
  // For simplicity, use 4-week rolling windows
  const currentWeeks = getWeekRange(4, { startWeek: currentWeek, direction: 'backward' })
  const firstCurrentWeek = currentWeeks[currentWeeks.length - 1]

  // Get 4 weeks before the first week of current range
  const previousStart = getPreviousIsoWeek(firstCurrentWeek)
  const previousWeeks = getWeekRange(4, { startWeek: previousStart, direction: 'backward' })
  const firstPreviousWeek = previousWeeks[previousWeeks.length - 1]

  // Format as ranges
  const { year: y1, week: w1 } = extractWeekParts(firstCurrentWeek)
  const { week: w1End } = extractWeekParts(currentWeeks[0])
  const { year: y2, week: w2 } = extractWeekParts(firstPreviousWeek)
  const { week: w2End } = extractWeekParts(previousWeeks[0])

  return {
    period1: `${y1}-W${w1.toString().padStart(2, '0')}:W${w1End.toString().padStart(2, '0')}`,
    period2: `${y2}-W${w2.toString().padStart(2, '0')}:W${w2End.toString().padStart(2, '0')}`,
  }
}

/**
 * Format period label for display
 */
export function formatPeriodLabel(period: string, _mode?: ComparisonMode): string {
  if (period.includes(':')) {
    // Range format: "2026-W01:W05" -> "Янв" (month name) based on first week
    const [startWeek] = period.split(':')
    // startWeek might be "2026-W01" or just "W01" if same year
    const fullWeek = startWeek.includes('-') ? startWeek : `${period.split('-')[0]}-${startWeek}`
    try {
      const { month } = getMonthFromIsoWeek(fullWeek)
      return MONTH_NAMES_RU[month - 1]
    } catch {
      return startWeek
    }
  }

  // Single week: "2026-W05" -> "W05"
  const { week } = extractWeekParts(period)
  return `W${week.toString().padStart(2, '0')}`
}

/** localStorage key for comparison mode */
export const COMPARISON_MODE_STORAGE_KEY = 'comparisonMode'
