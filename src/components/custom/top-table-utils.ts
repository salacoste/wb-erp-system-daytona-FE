/**
 * Shared Table Formatting Utilities
 * Used by TopProductsTable and TopBrandsTable
 * Extracted: Epic 74, Story 74.6
 */

// Canonical Russian-locale percent formatter (comma decimal + NBSP, e.g. "15,5 %").
// iter-69: formatPercent was the dot-locale form (no comma, no NBSP) → migrated to canonical
// (dot-locale percent consolidation — see docs/process/dot-locale-percent-consolidation-proposal.md).
import { formatPercentage } from '@/lib/utils'

/** Format currency value in Russian locale */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format a percent-units value (0-100 scale, e.g. margin_pct/contribution_pct) in Russian locale.
 * null → em dash (anti-pattern #8: a missing ratio is unknown, not 0). Fixed 1 decimal.
 */
export function formatPercent(value: number | null): string {
  if (value === null) return '—'
  return formatPercentage(value, 1)
}

/** Get margin color class based on value */
export function getMarginColor(margin: number | null): string {
  if (margin === null) return 'text-gray-400'
  if (margin >= 30) return 'text-green-600'
  if (margin >= 15) return 'text-yellow-600'
  if (margin >= 0) return 'text-orange-500'
  return 'text-red-600'
}
