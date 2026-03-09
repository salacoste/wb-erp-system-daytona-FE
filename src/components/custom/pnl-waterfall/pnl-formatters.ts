/**
 * PnL Waterfall Formatters
 *
 * Standalone formatting helpers for P&L display.
 * Extracted from PnLWaterfall.tsx — pure structural refactor.
 */

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

/** Format percentage */
export const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(1)}%`
}
