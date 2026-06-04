/**
 * Analytics Utility Functions
 * Story 6.3-FE: ROI & Profit Metrics Display
 * Story 40.6-FE: Orders Analytics Dashboard
 * Request #52: Storage SKU Breakdown for Weekly Reports
 *
 * Split into modules (Story 74.5):
 * - roi-profit-utils.ts: ROI/profit formatting & calculations
 * - storage-week-utils.ts: ISO week utilities for storage analytics
 * - orders-analytics-utils.ts: SLA, velocity, duration, countdown, plurals
 * - this file: Barrel re-exports + storage discrepancy helpers
 */

// Barrel re-exports — preserve consumer API
export {
  getROIColor,
  getROIRating,
  formatProfitPerUnit,
  formatROI,
  calculateProfitPerUnit,
  calculateROI,
} from './roi-profit-utils'

export {
  parseIsoWeek,
  formatIsoWeekString,
  generateWeekRange,
  fillMissingWeeks,
  getWeekDateRange,
} from './storage-week-utils'
export type { WeekDateRange } from './storage-week-utils'

export {
  getSlaStatusColor,
  getSlaStatusBgColor,
  getSlaStatusLabel,
  getConfirmationTimeColor,
  getCompletionTimeColor,
  getVelocityStatusColor,
  getVelocityStatusLabel,
  formatDuration,
  formatDurationShort,
  getCountdownColor,
  getOrdersPlural,
} from './orders-analytics-utils'

// ============================================================================
// Storage Data Discrepancy Tracking (Request #52)
// ============================================================================

/**
 * Discrepancy status between Weekly Report and Paid Storage API
 * Request #52: Expected ~1-2% variance due to different date attribution methods
 */
export type DiscrepancyStatus = 'ok' | 'warning' | 'error'

/** Storage discrepancy analysis result */
export interface StorageDiscrepancy {
  /** Absolute difference in rubles */
  amount: number
  /** Percentage difference */
  percent: number
  /** Status based on threshold */
  status: DiscrepancyStatus
}

/**
 * Determine discrepancy status based on percentage
 * Request #52: Thresholds validated against W49 (Dec 1-7, 2025) data
 *
 * | Threshold | Status | Action |
 * |-----------|--------|--------|
 * | < 3% | ok | Expected variance, no action needed |
 * | 3-5% | warning | Investigate if recurring |
 * | > 5% | error | Data quality issue, requires investigation |
 */
export function getDiscrepancyStatus(percent: number): DiscrepancyStatus {
  if (percent < 3) return 'ok'
  if (percent < 5) return 'warning'
  return 'error'
}

/**
 * Calculate discrepancy between Weekly Report storage and Paid Storage API
 * Request #52: Use for reconciliation and transparency in UI
 *
 * @example
 * calculateStorageDiscrepancy(1923.34, 1949.52)
 * // { amount: 26.18, percent: 1.36, status: 'ok' }
 */
export function calculateStorageDiscrepancy(
  officialCost: number,
  skuTotalCost: number
): StorageDiscrepancy {
  const amount = Math.abs(officialCost - skuTotalCost)
  const percent = officialCost > 0 ? (amount / officialCost) * 100 : 0

  return {
    amount,
    percent,
    status: getDiscrepancyStatus(percent),
  }
}

/**
 * True when the paid-storage API total diverges from the weekly report beyond the canonical
 * tolerance (getDiscrepancyStatus: >= 3%). Single source of truth for the "Расхождение" warning
 * shown by StorageComparisonCard + CashflowExpenseGrid (iter-126).
 *
 * Replaces a flat `Math.abs(storage_difference) > 1` (1 ₽) absolute check that over-flagged
 * large-storage cabinets (a 2% diff on 100 000 ₽ tripped the warning despite Request #52 saying
 * <3% is expected variance, no action). A null/zero weekly report → false (no baseline to compare
 * against — the difference is unknown, not a divergence).
 */
export function isStorageDivergent(storageApi: number, weeklyReport: number | null): boolean {
  if (weeklyReport == null || weeklyReport <= 0) return false
  // arg order is intentionally (weekly, api): weeklyReport is calculateStorageDiscrepancy's
  // `officialCost` baseline, storageApi its `skuTotalCost` → percent = |weekly−api|/weekly (#52).
  return calculateStorageDiscrepancy(weeklyReport, storageApi).status !== 'ok'
}

/** Get CSS color class for discrepancy status badge */
export function getDiscrepancyColor(status: DiscrepancyStatus): string {
  switch (status) {
    case 'ok':
      return 'text-green-600 bg-green-50'
    case 'warning':
      return 'text-yellow-600 bg-yellow-50'
    case 'error':
      return 'text-red-600 bg-red-50'
  }
}

/** Get discrepancy status label in Russian */
export function getDiscrepancyLabel(status: DiscrepancyStatus): string {
  switch (status) {
    case 'ok':
      return 'Данные совпадают'
    case 'warning':
      return 'Небольшое расхождение'
    case 'error':
      return 'Проверьте данные'
  }
}
