/**
 * Number formatters (Russian locale: comma decimal, space thousands)
 * Extracted from formatters.ts — barrel re-exported from formatters.ts for backward compat.
 */

/**
 * Formats a number with Russian grouping (space separator), rounded to integer.
 * Use for counts and quantities. NOT for opaque IDs (use String(id) instead).
 * @param value - The numeric value to format
 * @returns Formatted string (e.g., "1 234 567")
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value))
}

/**
 * Formats a FRACTIONAL number with Russian locale (comma decimal), fixed decimal places.
 * For bare unitless decimals (rates, velocities, multipliers) — NOT percents (use formatPercentage)
 * or currency (formatCurrency). No NBSP unless thousands-grouping applies. Replaces ad-hoc
 * `value.toFixed(n)` (dot-locale) and `.toFixed(n).replace('.', ',')` patterns.
 * Rounding is Intl halfExpand (e.g. 1.45 → "1,5"), unlike toFixed's FP half-to-even.
 * @param value - The numeric value to format
 * @param decimals - Exact number of fraction digits (default 1)
 * @returns Formatted string (e.g., "12,5"; whole numbers keep the trailing zero → "2,0";
 *   values ≥1000 get NBSP thousands-grouping → "1 234,5")
 */
export function formatDecimal(value: number, decimals = 1): string {
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Formats a number as ROAS (Return on Ad Spend)
 * @param value - The numeric ROAS value
 * @returns Formatted ROAS string (e.g., "2,5x")
 */
export function formatRoas(value: number): string {
  return `${value.toFixed(1).replace('.', ',')}x`
}
