/**
 * SKU Financials Table Formatters
 * Extracted from SkuFinancialsTable.tsx — pure formatting helpers
 */

import { formatCogsCost } from '@/lib/formatters'
import { formatPercentage } from '@/lib/utils'

/**
 * Format currency in Russian locale.
 * Delegates to canonical formatCogsCost (2 fixed decimal places, null → "—").
 */
export function formatCurrency(value: number | null): string {
  return formatCogsCost(value)
}

/**
 * Format percentage
 */
export function formatPercent(value: number | null): string {
  if (value === null) return '—'
  // Russian locale: comma + NBSP ("15,5 %"). value is a 0-100 percent; formatPercentage divides by 100.
  return formatPercentage(value, 1)
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
