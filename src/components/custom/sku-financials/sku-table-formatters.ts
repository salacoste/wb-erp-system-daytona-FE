/**
 * SKU Financials Table Formatters
 * Extracted from SkuFinancialsTable.tsx — pure formatting helpers
 */

/**
 * Format currency in Russian locale
 */
export function formatCurrency(value: number | null): string {
  if (value === null) return '—'
  return (
    value.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }) + ' ₽'
  )
}

/**
 * Format percentage
 */
export function formatPercent(value: number | null): string {
  if (value === null) return '—'
  return value.toFixed(1) + '%'
}

/**
 * Get color class based on value (positive = green, negative = red)
 */
export function getValueColorClass(value: number | null): string {
  if (value === null) return 'text-gray-400'
  if (value > 0) return 'text-green-600'
  if (value < 0) return 'text-red-600'
  return 'text-gray-600'
}
