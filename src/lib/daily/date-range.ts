/**
 * Date Range Utilities
 * Story 61.9-FE: Daily Breakdown Support
 *
 * Functions for date range generation and calculation.
 */

import type { DailyMetrics } from '@/types/daily-metrics'
import { createEmptyDailyMetrics } from './day-utils'

/**
 * Fill missing days in a date range with zero-valued DailyMetrics.
 * Ensures continuous daily data between from and to dates.
 *
 * @param existingData - Array of DailyMetrics with potentially missing days
 * @param fromDate - Start date in YYYY-MM-DD format
 * @param toDate - End date in YYYY-MM-DD format
 * @returns Complete array with all days filled, sorted by date ascending
 */
export function fillMissingDays(
  existingData: DailyMetrics[],
  fromDate: string,
  toDate: string
): DailyMetrics[] {
  const result: DailyMetrics[] = []
  const existingByDate = new Map(existingData.map(d => [d.date, d]))

  const start = new Date(fromDate)
  const end = new Date(toDate)
  const current = new Date(start)

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    if (existingByDate.has(dateStr)) {
      result.push(existingByDate.get(dateStr)!)
    } else {
      result.push(createEmptyDailyMetrics(dateStr))
    }
    current.setDate(current.getDate() + 1)
  }

  return result.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Generate array of date strings for a date range.
 *
 * @param fromDate - Start date in YYYY-MM-DD format
 * @param toDate - End date in YYYY-MM-DD format
 * @returns Array of date strings in YYYY-MM-DD format
 */
export function getDateRange(fromDate: string, toDate: string): string[] {
  const dates: string[] = []
  const start = new Date(fromDate)
  const end = new Date(toDate)
  const current = new Date(start)

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }

  return dates
}

/**
 * Get number of days in a date range (inclusive).
 *
 * @param fromDate - Start date in YYYY-MM-DD format
 * @param toDate - End date in YYYY-MM-DD format
 * @returns Number of days (inclusive)
 */
export function getDaysInRange(fromDate: string, toDate: string): number {
  const start = new Date(fromDate)
  const end = new Date(toDate)
  const diffTime = end.getTime() - start.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}
