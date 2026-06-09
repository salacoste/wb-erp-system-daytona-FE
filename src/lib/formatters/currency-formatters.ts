/**
 * Currency formatters (Russian Ruble, ru-RU locale)
 * Extracted from formatters.ts — barrel re-exported from formatters.ts for backward compat.
 */

/** Formats a number as Russian Ruble currency (e.g., "1 234 567,89 ₽") */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * COGS unit-cost formatter — 2 fixed decimal places, null/NaN/undefined → "—".
 * Consolidates 5 former duplicates (cogs-edit-helpers, useCogsHistoryDisplay,
 * CogsHistoryMeta, sku-table-formatters, financial-summary-formatters).
 * COGS is a per-unit cost so 2 decimal places are always shown (e.g. "1 250,50 ₽").
 */
export function formatCogsCost(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
