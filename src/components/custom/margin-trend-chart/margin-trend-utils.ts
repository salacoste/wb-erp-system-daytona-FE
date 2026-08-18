/**
 * Utility functions for MarginTrendChart
 * Story 4.7: Margin Analysis by Time Period
 */

/**
 * Format date range for tooltip display
 * Example: "06.10 - 12.10"
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const formatShort = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return `${day}.${month}`
  }

  return `${formatShort(startDate)} - ${formatShort(endDate)}`
}

/**
 * Format week for X-axis display
 * Converts "2025-W47" to "W47"
 */
export function formatWeekLabel(week: string): string {
  return week.replace(/^\d{4}-/, '') // Remove year prefix
}

/**
 * Format margin percentage for the recharts Y-axis tick.
 * Genuine dot-locale exception (NOT migrated to formatPercentage): recharts axis-tick formatters
 * stay a plain terse string — per dot-locale-consolidation-proposal §4. Used as
 * <YAxis tickFormatter={formatMarginAxis} /> in MarginTrendChart.
 */
export function formatMarginAxis(value: number): string {
  return `${value.toFixed(0)}%` // locale-percent-allow: recharts Y-axis tick (terse plain string)
}

/**
 * Calculate Y-axis domain with padding
 * Returns [min, max] tuple for the Y-axis
 */
export function calculateYDomain(data: Array<{ margin_pct: number | null }>): {
  marginValues: number[]
  hasMarginData: boolean
  minMargin: number
  maxMargin: number
  yDomain: [number, number]
} {
  const marginValues = data
    .map(d => d.margin_pct)
    .filter((m): m is number => m !== null && m !== undefined)
  const hasMarginData = marginValues.length > 0
  const minMargin = hasMarginData ? Math.min(...marginValues) : -10
  const maxMargin = hasMarginData ? Math.max(...marginValues) : 50
  const padding = Math.abs(maxMargin - minMargin) * 0.1
  const yDomain: [number, number] = [
    Math.floor(minMargin - padding),
    Math.ceil(maxMargin + padding),
  ]

  return { marginValues, hasMarginData, minMargin, maxMargin, yDomain }
}

/**
 * Get dot color based on margin value
 * Green for positive, red for negative, gray for zero
 */
export function getMarginDotColor(marginPct: number): string {
  // 168.10: semantic chart tokens (var() is valid in SVG fill/stroke attrs)
  if (marginPct > 0) return 'var(--color-chart-positive)'
  if (marginPct < 0) return 'var(--color-chart-negative)'
  return 'var(--color-chart-reference)'
}
