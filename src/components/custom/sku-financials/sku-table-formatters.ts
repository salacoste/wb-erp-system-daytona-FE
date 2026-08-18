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
 * Contribution share: part / total × 100. Returns null when `part` is null, or
 * `total` is null/0 (avoids divide-by-zero and a misleading "0,0 %"). Used for
 * the competitor-parity share-% columns on the SKU financials table: BD (revenue
 * contribution), BE (gross-profit contribution), BC (logistics / own revenue).
 * Sibling of `@/lib/analytics-utils#sharePercentage` (which also accepts
 * `undefined` for the aggregated margin tables); this overload serves the SKU
 * table whose fields are `number | null`.
 * Pure + unit-tested.
 */
export function sharePercentage(part: number | null, total: number | null): number | null {
  if (part == null || total == null || total === 0) return null
  return (part / total) * 100
}

/**
 * Format signed currency — prefixes "+" for positive values (WCAG 1.4.1: non-color
 * indicator alongside getValueColorClass). Negatives already get "−" from Intl.
 */
export function formatSignedCurrency(value: number | null): string {
  if (value === null) return '—'
  if (value > 0) return `+${formatCurrency(value)}`
  return formatCurrency(value)
}

/**
 * Get color class based on value (positive = green, negative = red)
 */
// 168.9: value-sign → semantic financial tokens (wave idiom); zero/null stay muted.
export function getValueColorClass(value: number | null): string {
  if (value === null) return 'text-muted-foreground'
  if (value > 0) return 'text-financial-positive'
  if (value < 0) return 'text-financial-negative'
  return 'text-muted-foreground'
}
