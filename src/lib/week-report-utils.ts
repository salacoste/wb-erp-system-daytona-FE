/**
 * Week Report Utility Functions
 * Data Availability Indicators for Dashboard
 *
 * Pure utility functions for determining weekly report availability dates
 * and data availability status for dashboard metrics.
 *
 * @see docs/request-backend/136-DAILY-DATA-AVAILABILITY-GUIDE.md
 */

import { format, nextTuesday } from 'date-fns'
import { ru } from 'date-fns/locale'
import { getWeekEndDate, isCurrentWeek, isCurrentMonth } from './period-helpers'

/**
 * Data availability status for dashboard metrics
 *
 * @see docs/request-backend/136-DAILY-DATA-AVAILABILITY-GUIDE.md
 */
export type DataAvailability = 'realtime' | 'delayed' | 'pending_week' | 'unavailable'

/**
 * Metric availability status with metadata
 */
export interface MetricStatus {
  /** Actual value or null if unavailable */
  value: number | null
  /** Availability status */
  availability: DataAvailability
  /** Last data update timestamp */
  lastUpdated?: Date
  /** Expected date for pending_week status */
  expectedAt?: Date
}

/**
 * Metric categories and their availability during incomplete weeks
 *
 * @see docs/request-backend/136-DAILY-DATA-AVAILABILITY-GUIDE.md - Summary table
 */
export const METRIC_AVAILABILITY: Record<string, DataAvailability> = {
  // Real-time (<=5 min delay)
  ordersCount: 'realtime',
  ordersRevenue: 'realtime',
  fboOrders: 'realtime',
  fbsOrders: 'realtime',
  advertisingSpend: 'realtime',

  // Delayed 1-2 days
  dailySales: 'delayed',
  retailAmount: 'delayed',
  ppvzForPay: 'delayed',

  // Only after week closes
  salesGross: 'pending_week',
  logisticsTotal: 'pending_week',
  storageTotal: 'pending_week',
  theoreticalProfit: 'pending_week',
  cogsTotal: 'pending_week',
}

/**
 * Get expected date when weekly financial report will be available
 *
 * Weekly financial reports from Wildberries become available on Tuesday/Wednesday
 * after the week closes (Sunday 23:59:59).
 *
 * @param weekString - ISO week format "YYYY-Www" (e.g., "2026-W05")
 * @returns Expected date when report will be available (Tuesday/Wednesday of next week)
 *
 * @example
 * getWeeklyReportExpectedDate('2026-W05')
 * // For week ending Feb 2, 2026: returns Feb 4, 2026 (Tuesday)
 */
export function getWeeklyReportExpectedDate(weekString: string): Date {
  const weekEnd = getWeekEndDate(weekString)
  // Report typically available Tuesday-Wednesday after week ends
  // We use Tuesday as the conservative estimate
  const nextTues = nextTuesday(weekEnd)
  return nextTues
}

/**
 * Format expected report date for display
 *
 * @param weekString - ISO week format "YYYY-Www"
 * @returns Formatted date string in Russian locale
 *
 * @example
 * formatExpectedReportDate('2026-W05')
 * // Returns "4 февраля"
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

/**
 * Get data availability info for display
 *
 * @param availability - DataAvailability status
 * @param expectedDate - Expected date for pending_week (optional)
 * @returns Display information object
 */
export function getAvailabilityDisplayInfo(
  availability: DataAvailability,
  expectedDate?: Date
): {
  label: string
  description: string
  color: 'green' | 'yellow' | 'gray' | 'red'
} {
  switch (availability) {
    case 'realtime':
      return {
        label: 'В реальном времени',
        description: 'Данные обновляются каждые 5-60 минут',
        color: 'green',
      }
    case 'delayed':
      return {
        label: 'Задержка 1-2 дня',
        description: 'Данные WB поступают с задержкой 1-2 дня',
        color: 'yellow',
      }
    case 'pending_week':
      return {
        label: `Ожидание отчёта`,
        description: expectedDate
          ? `Финансовый отчёт будет доступен ~${format(expectedDate, 'd MMMM', { locale: ru })}`
          : 'Данные появятся после закрытия недели',
        color: 'gray',
      }
    case 'unavailable':
    default:
      return {
        label: 'Недоступно',
        description: 'Данные недоступны для этого периода',
        color: 'red',
      }
  }
}
