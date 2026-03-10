/**
 * ROI & Profit Metrics Utilities
 * Story 6.3-FE: ROI & Profit Metrics Display
 * Extracted from analytics-utils.ts (Story 74.5)
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
 */
export function getROIColor(roi: number | null | undefined): string {
  if (roi === null || roi === undefined) return 'text-gray-400'
  if (roi >= 100) return 'text-green-600'
  if (roi >= 50) return 'text-green-500'
  if (roi >= 20) return 'text-yellow-600'
  if (roi >= 0) return 'text-orange-500'
  return 'text-red-600'
}

/** Get ROI rating label */
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

/** Format ROI percentage value */
export function formatROI(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(1)}%`
}

/**
 * Calculate profit per unit from profit and quantity
 * Frontend calculation when backend doesn't provide the field
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
 */
export function calculateROI(
  profit: number | null | undefined,
  cogs: number | null | undefined
): number | null {
  if (profit === null || profit === undefined) return null
  if (cogs === null || cogs === undefined || cogs === 0) return null
  return (profit / cogs) * 100
}
