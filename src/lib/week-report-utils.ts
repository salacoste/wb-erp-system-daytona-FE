/**
 * Week Report Utility Functions
 * Data Availability Indicators for Dashboard
 *
 * Pure utility functions for determining weekly report availability dates
 * and data availability status for dashboard metrics.
 * Types & display logic live in week-report-availability.ts.
 *
 * @see docs/request-backend/136-DAILY-DATA-AVAILABILITY-GUIDE.md
 */

// Re-export availability types & display logic for backward compatibility
export type { DataAvailability, MetricStatus } from './week-report-availability'
export { METRIC_AVAILABILITY, getAvailabilityDisplayInfo } from './week-report-availability'
import { METRIC_AVAILABILITY } from './week-report-availability'
import type { DataAvailability } from './week-report-availability'

import { format, nextMonday } from 'date-fns'
import { ru } from 'date-fns/locale'
import { getWeekEndDate, isCurrentWeek, isCurrentMonth } from './period-helpers'

/**
 * Get expected date when weekly financial report will be available
 *
 * Weekly financial reports from Wildberries become available on Tuesday/Wednesday
 * after the week closes (Sunday 23:59:59).
 *
 * @param weekString - ISO week format "YYYY-Www" (e.g., "2026-W05")
 * @returns Expected date when report will be available (Tuesday/Wednesday of next week)
 */
export function getWeeklyReportExpectedDate(weekString: string): Date {
  const weekEnd = getWeekEndDate(weekString)
  // WB report is generated on Monday after week ends (Sunday)
  const nextMon = nextMonday(weekEnd)
  return nextMon
}

/**
 * Format expected report date for display
 *
 * @param weekString - ISO week format "YYYY-Www"
 * @returns Formatted date string in Russian locale
 */
export function formatExpectedReportDate(weekString: string): string {
  const expectedDate = getWeeklyReportExpectedDate(weekString)
  return format(expectedDate, 'd MMMM', { locale: ru })
}

/**
 * Check if selected period is incomplete (current week/month)
 *
 * @param period - Period string (week "YYYY-Www" or month "YYYY-MM")
 * @param periodType - Type of period ('week' | 'month')
 * @returns true if the period is incomplete (current/ongoing)
 */
export function isPeriodIncomplete(period: string, periodType: 'week' | 'month'): boolean {
  return periodType === 'week' ? isCurrentWeek(period) : isCurrentMonth(period)
}

/**
 * Get availability status for a metric based on current period
 *
 * @param metricKey - Key from METRIC_AVAILABILITY
 * @param period - Period string
 * @param periodType - Type of period
 * @returns DataAvailability status
 */
export function getMetricAvailability(
  metricKey: string,
  period: string,
  periodType: 'week' | 'month'
): DataAvailability {
  // If period is complete, all data is available
  if (!isPeriodIncomplete(period, periodType)) {
    return 'realtime' // Historical data is fully available
  }

  // For incomplete periods, return the configured availability
  return METRIC_AVAILABILITY[metricKey] ?? 'unavailable'
}

/**
 * Check if a metric is pending weekly report
 *
 * @param metricKey - Key from METRIC_AVAILABILITY
 * @param period - Period string
 * @param periodType - Type of period
 * @returns true if metric is waiting for weekly report
 */
export function isMetricPendingWeeklyReport(
  metricKey: string,
  period: string,
  periodType: 'week' | 'month'
): boolean {
  return getMetricAvailability(metricKey, period, periodType) === 'pending_week'
}
