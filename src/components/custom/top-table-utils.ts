/**
 * Shared Table Formatting Utilities
 * Used by TopProductsTable and TopBrandsTable
 * Extracted: Epic 74, Story 74.6
 */

/** Format currency value in Russian locale */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

/** Format percentage value */
export function formatPercent(value: number | null): string {
  if (value === null) return '\u2014'
  return `${value.toFixed(1)}%`
}

/** Get margin color class based on value */
export function getMarginColor(margin: number | null): string {
  if (margin === null) return 'text-gray-400'
  if (margin >= 30) return 'text-green-600'
  if (margin >= 15) return 'text-yellow-600'
  if (margin >= 0) return 'text-orange-500'
  return 'text-red-600'
}
