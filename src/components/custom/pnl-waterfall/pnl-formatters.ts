/**
 * PnL Waterfall Formatters
 *
 * Standalone formatting helpers for P&L display.
 * Extracted from PnLWaterfall.tsx — pure structural refactor.
 */

// Canonical Russian-locale percent formatter (comma decimal + NBSP, e.g. "15,5 %").
// iter-72: formatPercent was the dot-locale form (no comma, no NBSP) → migrated to canonical
// (dot-locale percent consolidation — see docs/process/dot-locale-percent-consolidation-proposal.md).
import { formatPercentage } from '@/lib/utils'

/** Format currency with Russian locale */
export const formatCurrency = (value: number | null | undefined, showSign = false): string => {
  if (value === null || value === undefined) return '—'
  const formatted = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(Math.abs(value))

  if (showSign && value !== 0) {
    return value < 0 ? `−${formatted}` : `+${formatted}`
  }
  return value < 0 ? `−${formatted}` : formatted
}

/**
 * Format a percent-units value (0-100 scale, signed) in Russian locale (comma decimal + NBSP,
 * fixed 1 decimal). Negatives render with an ASCII hyphen-minus via Intl (e.g. "-7,1 %").
 * null/undefined → em dash (anti-pattern #8: a missing ratio is unknown, not 0).
 */
export const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—'
  return formatPercentage(value, 1)
}
