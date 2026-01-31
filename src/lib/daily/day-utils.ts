/**
 * Day Utilities
 * Story 61.9-FE: Daily Breakdown Support
 *
 * Functions for day-of-week calculations and empty metrics creation.
 */

import type { DailyMetrics } from '@/types/daily-metrics'

/**
 * Get ISO day of week from date string.
 * Returns 1 for Monday, 7 for Sunday (ISO 8601 standard).
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns ISO day of week (1-7)
 * @throws Error if date string is invalid
 */
export function getDayOfWeek(dateStr: string): number {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`)
  }
  // JS getDay: 0=Sunday, 1=Monday, ..., 6=Saturday
  // ISO: 1=Monday, ..., 7=Sunday
  const jsDay = date.getDay()
  return jsDay === 0 ? 7 : jsDay
}

/**
 * Create an empty DailyMetrics object for a given date.
 * All numeric values are initialized to zero.
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns DailyMetrics with all zeros
 */
export function createEmptyDailyMetrics(dateStr: string): DailyMetrics {
  return {
    date: dateStr,
    dayOfWeek: getDayOfWeek(dateStr),
    orders: 0,
    ordersCogs: 0,
    sales: 0,
    salesCogs: 0,
    advertising: 0,
    logistics: 0,
    storage: 0,
    theoreticalProfit: 0,
  }
}
