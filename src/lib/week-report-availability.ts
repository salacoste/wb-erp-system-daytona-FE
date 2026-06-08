/**
 * Data Availability Types & Display Logic
 * Extracted from week-report-utils.ts for file-size compliance.
 *
 * @see docs/request-backend/136-DAILY-DATA-AVAILABILITY-GUIDE.md
 */

import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

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
