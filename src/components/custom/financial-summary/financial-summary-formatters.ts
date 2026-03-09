/**
 * Financial Summary formatters and helpers
 * Extracted from FinancialSummaryTable.tsx - pure utility functions
 */

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
 * Calculate percentage of turnover
 */
export function pctOfTurnover(value: number, base: number): string {
  return base > 0 ? ((value / base) * 100).toFixed(1) + '%' : '\u2014'
}
