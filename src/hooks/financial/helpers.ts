/**
 * Financial Summary Helper Functions
 * Story 3.5: Financial Summary View
 *
 * Utility functions for financial calculations and formatting.
 */

import type { ChangeResult } from './types'

/**
 * Get current ISO week (YYYY-Www format)
 */
export function getCurrentIsoWeek(): string {
  const now = new Date()

  // Set to nearest Thursday (ISO week date definition)
  const thursday = new Date(now.getTime())
  thursday.setDate(now.getDate() + 3 - ((now.getDay() + 6) % 7))

  // January 4 is always in week 1
  const jan4 = new Date(thursday.getFullYear(), 0, 4)

  // Calculate week number
  const weekNumber = Math.ceil(
    ((thursday.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7
  )

  return `${thursday.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`
}

/**
 * Format week string for display (e.g., "2025-W46" -> "Неделя 46, 2025")
 */
export function formatWeekDisplay(week: string): string {
  const match = week.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return week

  const [, year, weekNum] = match
  return `Неделя ${parseInt(weekNum, 10)}, ${year}`
}

/**
 * Format week string with date range (e.g., "2025-W46" -> "Неделя 46 (11.11 - 17.11)")
 */
export function formatWeekWithDateRange(week: string): string {
  const match = week.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return week

  const [, year, weekNumStr] = match
  const weekNum = parseInt(weekNumStr, 10)

  // Calculate first day of week (Monday)
  const jan4 = new Date(parseInt(year, 10), 0, 4)
  const jan4Day = jan4.getDay() || 7
  const weekStart = new Date(jan4.getTime())
  weekStart.setDate(jan4.getDate() - jan4Day + 1 + (weekNum - 1) * 7)

  // Calculate last day of week (Sunday)
  const weekEnd = new Date(weekStart.getTime())
  weekEnd.setDate(weekStart.getDate() + 6)

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return `${day}.${month}`
  }

  return `Неделя ${weekNum} (${formatDate(weekStart)} - ${formatDate(weekEnd)})`
}

/**
 * Calculate percentage change between two values
 */
export function calculateChange(
  current: number | undefined | null,
  previous: number | undefined | null
): ChangeResult {
  if (
    current === undefined ||
    current === null ||
    previous === undefined ||
    previous === null ||
    previous === 0
  ) {
    return { value: null, percentage: null, trend: 'same' }
  }

  const value = current - previous
  const percentage = (value / Math.abs(previous)) * 100

  const trend = value > 0 ? 'up' : value < 0 ? 'down' : 'same'

  return { value, percentage, trend }
}
