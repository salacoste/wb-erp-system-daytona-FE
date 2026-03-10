/**
 * FBS Analytics Chart and Formatting Utilities
 * Story 51.1-FE: Types & API Module
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Extracted from fbs-analytics-utils.ts for file size compliance.
 * Contains chart configuration, date formatting, and number formatting functions.
 */

// ============================================================================
// Trends Chart Utilities
// ============================================================================

/**
 * Metric visibility state type for chart legend toggle
 */
export interface MetricVisibility {
  orders: boolean
  revenue: boolean
  cancellations: boolean
}

/**
 * Default metric visibility - orders and revenue visible, cancellations hidden
 */
export const DEFAULT_METRIC_VISIBILITY: MetricVisibility = {
  orders: true,
  revenue: true,
  cancellations: false,
}

/**
 * Chart line colors for each metric
 */
export const CHART_LINE_COLORS = {
  orders: '#3B82F6', // Blue
  revenue: '#22C55E', // Green
  cancellations: '#EF4444', // Red
} as const

/**
 * Russian labels for chart metrics
 */
export const METRIC_LABELS = {
  orders: 'Заказы',
  revenue: 'Выручка',
  cancellations: 'Отмены',
} as const

/**
 * Get metric label in Russian
 */
export function getMetricLabel(metric: keyof typeof METRIC_LABELS): string {
  return METRIC_LABELS[metric]
}

// ============================================================================
// Chart Date Formatting
// ============================================================================

/**
 * Format date for X-axis display (DD.MM)
 *
 * @param dateStr - ISO date string or week string (YYYY-Www)
 * @returns Formatted date string
 *
 * @example
 * formatChartDate('2026-01-15') // '15.01'
 * formatChartDate('2026-W03') // 'W03'
 */
export function formatChartDate(dateStr: string): string {
  // Handle week format (YYYY-Www)
  if (dateStr.includes('-W')) {
    return dateStr.replace(/^\d{4}-/, '') // Remove year prefix, keep Www
  }

  // Handle ISO date format
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr

  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${day}.${month}`
}

/**
 * Format date for tooltip display (DD.MM.YYYY)
 *
 * @param dateStr - ISO date string or week string
 * @returns Formatted date string
 *
 * @example
 * formatTooltipDate('2026-01-15') // '15.01.2026'
 * formatTooltipDate('2026-W03') // 'Неделя 03, 2026'
 */
export function formatTooltipDate(dateStr: string): string {
  // Handle week format (YYYY-Www)
  if (dateStr.includes('-W')) {
    const [year, week] = dateStr.split('-W')
    return `Неделя ${week}, ${year}`
  }

  // Handle ISO date format
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr

  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

/**
 * Format large numbers with Russian grouping (space separator)
 *
 * @param value - Number to format
 * @returns Formatted string
 *
 * @example
 * formatNumber(1234567) // '1 234 567'
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value))
}

/**
 * Format percentage for display
 *
 * @param value - Percentage value (0-100)
 * @returns Formatted percentage string
 *
 * @example
 * formatPercentValue(6.67) // '6,67%'
 */
export function formatPercentValue(value: number): string {
  return (
    new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value) + '%'
  )
}
