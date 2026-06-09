/**
 * Percentage formatters (Russian locale: comma decimal, NBSP before %)
 * Extracted from formatters.ts — barrel re-exported from formatters.ts for backward compat.
 */

/**
 * Formats a number as percentage in Russian locale (e.g. "15,5 %").
 * @param value - Already in percent units (0-100; signed OK)
 * @param decimals - Fixed decimal places. Omit for 1-2 decimals. Pass 0 for "75 %".
 */
export function formatPercentage(value: number, decimals?: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits: decimals ?? 1,
    maximumFractionDigits: decimals ?? 2,
  }).format(value / 100)
}

/** Whole-percent variant ("75 %"). Use instead of `${value.toFixed(0)}%` (dot-locale). */
export function formatPercentageInt(value: number): string {
  return formatPercentage(value, 0)
}

/**
 * Formats a percentage-points (п.п.) delta with an explicit sign for gains.
 * Used for margin/gross-margin period-over-period comparisons (a difference of two
 * percentages is in п.п., NOT %). Russian locale: comma decimal ("+1,5 п.п.", not "+1.5 п.п.").
 * Not %-suffixed, so the dot-locale-percent ratchet doesn't catch it — guarded by unit test.
 * Extracted from MarginCard/GrossMarginCard (were byte-identical duplicates) to remove drift risk.
 * @param diff - Difference in percentage points
 * @returns Formatted string (e.g., "+1,5 п.п.", "-2,0 п.п.", "0,0 п.п.")
 */
export function formatPercentagePoints(diff: number): string {
  const sign = diff > 0 ? '+' : ''
  return `${sign}${diff.toFixed(1).replace('.', ',')} п.п.`
}
