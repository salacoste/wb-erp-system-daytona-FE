/**
 * Financial Summary formatters and helpers
 * Extracted from FinancialSummaryTable.tsx - pure utility functions
 */

// canonical Russian-locale formatter (comma + NBSP) — NOT the dot-locale
// `formatPercentage` shadow in advertising/utils/formatters.ts (same name, opposite output)
import { formatPercentage } from '@/lib/utils'

/**
 * Format currency value in Russian locale (RUB)
 */
export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return '\u2014'

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Calculate percentage of turnover.
 * Russian-locale rule: comma decimal + NBSP before "%" via canonical formatPercentage
 * (the old toFixed-then-percent concat rendered dot-locale "12.3%" with no NBSP \u2014 born this way
 * at Epic-74 extraction, never tested, so unflagged until now).
 * Non-positive base \u2192 em dash (anti-pattern #8: no denominator means the ratio is unknown).
 */
export function pctOfTurnover(value: number, base: number): string {
  return base > 0 ? formatPercentage((value / base) * 100, 1) : '\u2014'
}
