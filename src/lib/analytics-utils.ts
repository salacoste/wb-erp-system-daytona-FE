/**
 * Analytics Utility Functions
 * Story 6.3-FE: ROI & Profit Metrics Display
 * Request #52: Storage SKU Breakdown for Weekly Reports
 *
 * Formatting and styling utilities for analytics data.
 * Includes ISO week to date range conversion for Paid Storage API integration.
 */

/**
 * Get color class for ROI value
 * Story 6.3-FE: Color coding based on ROI thresholds
 *
 * | ROI Range | Color | Meaning |
 * |-----------|-------|---------|
 * | ≥100% | Green-600 | Excellent |
 * | 50-99% | Green-500 | Good |
 * | 20-49% | Yellow-600 | Average |
 * | 0-19% | Orange-500 | Low |
 * | <0% | Red-600 | Negative (losing money) |
 *
 * @param roi - ROI percentage value (e.g., 50 means 50%)
 * @returns Tailwind color class
 */
export function getROIColor(roi: number | null | undefined): string {
  if (roi === null || roi === undefined) return 'text-gray-400'
  if (roi >= 100) return 'text-green-600'   // Excellent: >100%
  if (roi >= 50) return 'text-green-500'    // Good: 50-100%
  if (roi >= 20) return 'text-yellow-600'   // Average: 20-50%
  if (roi >= 0) return 'text-orange-500'    // Low: 0-20%
  return 'text-red-600'                      // Negative ROI
}

/**
 * Get ROI rating label
 *
 * @param roi - ROI percentage value
 * @returns Rating label in Russian
 */
export function getROIRating(roi: number | null | undefined): string {
  if (roi === null || roi === undefined) return '—'
  if (roi >= 100) return 'Отлично'
  if (roi >= 50) return 'Хорошо'
  if (roi >= 20) return 'Средне'
  if (roi >= 0) return 'Низко'
  return 'Убыток'
}

/**
 * Format profit per unit value with currency suffix
 *
 * @param value - Profit per unit in rubles
 * @returns Formatted string like "125.50 ₽/ед." or "—"
 */
export function formatProfitPerUnit(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'

  const formatted = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value)

  return `${formatted}/ед.`
}

/**
 * Format ROI percentage value
 *
 * @param value - ROI percentage (e.g., 50.5 means 50.5%)
 * @returns Formatted string like "50.5%" or "—"
 */
export function formatROI(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(1)}%`
}

/**
 * Calculate profit per unit from profit and quantity
 * Frontend calculation when backend doesn't provide the field
 *
 * @param profit - Total profit
 * @param qty - Quantity sold
 * @returns Profit per unit or null if qty is 0
 */
export function calculateProfitPerUnit(
  profit: number | null | undefined,
  qty: number | null | undefined
): number | null {
  if (profit === null || profit === undefined) return null
  if (qty === null || qty === undefined || qty === 0) return null
  return profit / qty
}

/**
 * Calculate ROI from profit and COGS
 * Frontend calculation when backend doesn't provide the field
 *
 * @param profit - Total profit
 * @param cogs - Cost of goods sold
 * @returns ROI percentage or null if cogs is 0
 */
export function calculateROI(
  profit: number | null | undefined,
  cogs: number | null | undefined
): number | null {
  if (profit === null || profit === undefined) return null
  if (cogs === null || cogs === undefined || cogs === 0) return null
  return (profit / cogs) * 100
}

// ============================================================================
// ISO Week Utilities (Request #52)
// ============================================================================

/**
 * Parse ISO week string to year and week number
 * @param isoWeek - ISO week string (e.g., "2025-W40")
 * @returns { year, weekNum }
 */
export function parseIsoWeek(isoWeek: string): { year: number; weekNum: number } {
  const match = isoWeek.match(/^(\d{4})-W(\d{1,2})$/)
  if (!match) {
    throw new Error(`Invalid ISO week format: ${isoWeek}`)
  }
  return {
    year: parseInt(match[1], 10),
    weekNum: parseInt(match[2], 10),
  }
}

/**
 * Format year and week number to ISO week string
 * @param year - Year (e.g., 2025)
 * @param weekNum - Week number (1-53)
 * @returns ISO week string (e.g., "2025-W40")
 */
export function formatIsoWeekString(year: number, weekNum: number): string {
  return `${year}-W${String(weekNum).padStart(2, '0')}`
}

/**
 * Generate array of all ISO weeks between start and end (inclusive)
 * Handles year boundaries correctly.
 *
 * @param weekStart - Start week (e.g., "2025-W40")
 * @param weekEnd - End week (e.g., "2025-W48")
 * @returns Array of ISO week strings
 *
 * @example
 * generateWeekRange('2025-W40', '2025-W42')
 * // ["2025-W40", "2025-W41", "2025-W42"]
 */
export function generateWeekRange(weekStart: string, weekEnd: string): string[] {
  const start = parseIsoWeek(weekStart)
  const end = parseIsoWeek(weekEnd)

  const weeks: string[] = []
  let currentYear = start.year
  let currentWeek = start.weekNum

  // Get max weeks in year (52 or 53)
  const getMaxWeeks = (year: number): number => {
    // ISO week 53 exists if Jan 1 is Thursday, or Dec 31 is Thursday
    const jan1 = new Date(year, 0, 1)
    const dec31 = new Date(year, 11, 31)
    return (jan1.getDay() === 4 || dec31.getDay() === 4) ? 53 : 52
  }

  while (
    currentYear < end.year ||
    (currentYear === end.year && currentWeek <= end.weekNum)
  ) {
    weeks.push(formatIsoWeekString(currentYear, currentWeek))

    currentWeek++
    const maxWeeks = getMaxWeeks(currentYear)
    if (currentWeek > maxWeeks) {
      currentWeek = 1
      currentYear++
    }
  }

  return weeks
}

/**
 * Fill missing weeks in trend data with null values
 * Ensures all weeks in the range are represented for proper chart display.
 *
 * @param data - Existing trend data points
 * @param weekStart - Start of range
 * @param weekEnd - End of range
 * @returns Complete data array with all weeks
 *
 * @example
 * fillMissingWeeks(
 *   [{ week: '2025-W46', storage_cost: 1800 }],
 *   '2025-W44',
 *   '2025-W48'
 * )
 * // Returns array with W44, W45 (null), W46 (1800), W47 (null), W48 (null)
 */
export function fillMissingWeeks<T extends { week: string }>(
  data: T[],
  weekStart: string,
  weekEnd: string
): (T | { week: string; storage_cost: null; volume: null })[] {
  const allWeeks = generateWeekRange(weekStart, weekEnd)
  const dataMap = new Map(data.map(item => [item.week, item]))

  return allWeeks.map(week => {
    const existing = dataMap.get(week)
    if (existing) {
      return existing
    }
    // Return placeholder for missing week
    return {
      week,
      storage_cost: null,
      volume: null,
    }
  })
}

// ============================================================================
// ISO Week to Date Range Conversion (Request #52)
// ============================================================================

/**
 * Date range result from ISO week conversion
 */
export interface WeekDateRange {
  /** Start date (YYYY-MM-DD) - Monday of the week */
  dateFrom: string
  /** End date (YYYY-MM-DD) - Sunday of the week */
  dateTo: string
}

/**
 * Convert ISO week to date range for Paid Storage API
 * ISO week: Monday-Sunday, e.g. "2025-W49" = Dec 1-7, 2025
 *
 * Request #52: Required for joining weekly_payout_summary with paid_storage_daily
 * Reference: docs/request-backend/52-storage-sku-breakdown-for-weekly-reports.md
 *
 * @param isoWeek - ISO week string (e.g., "2025-W49")
 * @returns Date range with dateFrom (Monday) and dateTo (Sunday)
 *
 * @example
 * getWeekDateRange('2025-W49')
 * // { dateFrom: "2025-12-01", dateTo: "2025-12-07" }
 */
export function getWeekDateRange(isoWeek: string): WeekDateRange {
  // Parse "YYYY-WNN" format
  const match = isoWeek.match(/^(\d{4})-W(\d{1,2})$/)
  if (!match) {
    throw new Error(`Invalid ISO week format: ${isoWeek}. Expected format: YYYY-WNN (e.g., 2025-W49)`)
  }

  const year = parseInt(match[1], 10)
  const weekNum = parseInt(match[2], 10)

  if (weekNum < 1 || weekNum > 53) {
    throw new Error(`Invalid week number: ${weekNum}. Must be between 1 and 53`)
  }

  // Find first Monday of the year using ISO 8601 algorithm
  // Jan 4th is always in week 1 by ISO standard
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7 // Convert Sunday (0) to 7
  const firstMonday = new Date(jan4)
  firstMonday.setDate(jan4.getDate() - dayOfWeek + 1)

  // Calculate week start (Monday)
  const weekStart = new Date(firstMonday)
  weekStart.setDate(firstMonday.getDate() + (weekNum - 1) * 7)

  // Calculate week end (Sunday)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  return {
    dateFrom: weekStart.toISOString().slice(0, 10),
    dateTo: weekEnd.toISOString().slice(0, 10),
  }
}

// ============================================================================
// Storage Data Discrepancy Tracking (Request #52)
// ============================================================================

/**
 * Discrepancy status between Weekly Report and Paid Storage API
 * Request #52: Expected ~1-2% variance due to different date attribution methods
 */
export type DiscrepancyStatus = 'ok' | 'warning' | 'error'

/**
 * Storage discrepancy analysis result
 */
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
 *
 * @param percent - Discrepancy percentage (0-100)
 * @returns Discrepancy status
 */
export function getDiscrepancyStatus(percent: number): DiscrepancyStatus {
  if (percent < 3) return 'ok'      // Expected variance (~1-2%)
  if (percent < 5) return 'warning' // Investigate if recurring
  return 'error'                     // Data quality issue
}

/**
 * Calculate discrepancy between Weekly Report storage and Paid Storage API
 * Request #52: Use for reconciliation and transparency in UI
 *
 * @param officialCost - storageCost from weekly_payout_summary (official WB total)
 * @param skuTotalCost - Sum of storage costs from paid_storage_daily (SKU breakdown)
 * @returns Discrepancy analysis with amount, percent, and status
 *
 * @example
 * // W49 example from Request #52:
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
 * Format discrepancy for display
 *
 * @param discrepancy - Discrepancy analysis result
 * @returns Human-readable discrepancy string
 *
 * @example
 * formatDiscrepancy({ amount: 26.18, percent: 1.36, status: 'ok' })
 * // "26.18 ₽ (1.4%)"
 */
export function formatDiscrepancy(discrepancy: StorageDiscrepancy): string {
  const formattedAmount = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
  }).format(discrepancy.amount)

  return `${formattedAmount} (${discrepancy.percent.toFixed(1)}%)`
}

/**
 * Get CSS color class for discrepancy status badge
 *
 * @param status - Discrepancy status
 * @returns Tailwind CSS classes for badge styling
 */
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

/**
 * Get discrepancy status label in Russian
 *
 * @param status - Discrepancy status
 * @returns Human-readable label
 */
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
