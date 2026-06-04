/**
 * Formatting Utilities - Epic 37 Story 37.3
 *
 * Display formatting functions for aggregate metrics in merged product groups.
 * Currency/percent formatters use Russian locale (ru-RU, ₽). Exception: formatROAS returns a
 * bare en-locale decimal ("0.90") — ROAS is a unitless multiplier, not a currency/percent.
 *
 * @see frontend/docs/stories/epic-37/story-37.3-aggregate-metrics-display.BMAD.md
 */

// Canonical Russian-locale percent formatter (comma decimal + NBSP before "%", e.g. "71,2 %").
// Replaced a former LOCAL dot-locale `formatPercentage` shadow (same name, opposite output:
// rendered "71.2%" — no comma, no NBSP) that reached users via formatRevenueWithPercent in
// MergedGroupRows. The local shadow was deleted; @/lib/utils is the canonical source of truth.
import { formatPercentage } from '@/lib/utils'

// Memoized Intl.NumberFormat instance for currency formatting
// Creating once and reusing provides ~5-10% performance improvement for high-volume formatting
const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/**
 * Format currency value with Russian locale
 *
 * - Uses Russian number format with space thousand separator
 * - Displays ₽ (ruble) symbol
 * - No decimal places (minimumFractionDigits: 0)
 *
 * @param value - Numeric currency value
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(35570);      // Returns: "35 570 ₽"
 * formatCurrency(1234567);    // Returns: "1 234 567 ₽"
 * formatCurrency(0);          // Returns: "0 ₽"
 * formatCurrency(-500);       // Returns: "-500 ₽"
 */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

/**
 * Format revenue with inline organic contribution percentage
 *
 * Combines currency formatting with percentage display:
 * - Revenue formatted with Russian locale and ₽ symbol
 * - Percentage shown in parentheses, Russian locale (comma decimal + NBSP, fixed 1 decimal)
 *
 * @param revenue - Revenue amount
 * @param percentage - Organic contribution percentage (0-100)
 * @returns Formatted string: "revenue (percentage)"
 *
 * @example
 * // (spaces shown below are U+00A0 NBSP at runtime — both thousands-sep and pre-"%")
 * formatRevenueWithPercent(10234, 29.0);  // Returns: "10 234 ₽ (29,0 %)"
 * formatRevenueWithPercent(35570, 71.2);  // Returns: "35 570 ₽ (71,2 %)"
 * formatRevenueWithPercent(0, 0);         // Returns: "0 ₽ (0,0 %)"
 */
export function formatRevenueWithPercent(revenue: number, percentage: number): string {
  const formattedRevenue = formatCurrency(revenue)
  // decimals=1 preserves the original fixed-1-decimal output ("71,2 %", "100,0 %"),
  // now via the canonical comma+NBSP formatter instead of the old dot-locale shadow.
  const formattedPercentage = formatPercentage(percentage, 1)
  return formattedRevenue + ' (' + formattedPercentage + ')'
}

/**
 * Format ROAS (Return on Ad Spend) value
 *
 * - Null/undefined values display as "—" (em dash) for zero-spend cases
 * - Valid ROAS formatted with 2 decimal places
 *
 * @param roas - ROAS value or null (null when spend = 0)
 * @returns Formatted ROAS string or "—"
 *
 * @example
 * formatROAS(0.90);      // Returns: "0.90"
 * formatROAS(1.12);      // Returns: "1.12"
 * formatROAS(0.005);     // Returns: "0.01" (rounds to 2 decimals)
 * formatROAS(null);      // Returns: "—"
 * formatROAS(undefined); // Returns: "—"
 */
export function formatROAS(roas: number | null | undefined): string {
  // Edge case: No spend → return em dash
  if (roas === null || roas === undefined) {
    return '—'
  }

  // Normal case: Format with 2 decimal places
  return roas.toFixed(2)
}
