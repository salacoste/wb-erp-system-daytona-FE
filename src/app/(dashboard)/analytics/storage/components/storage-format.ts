/**
 * Storage route shared formatters — single source of truth (Story 169.12 dedupe).
 *
 * Absorbs the four duplicate local `formatCurrency` copies (trends-config,
 * SummaryCards, TopConsumersWidget, sku-table-utils) and the two duplicate
 * `formatWeekShort` copies (trends-config, WeekFilterBadge).
 */

/** Format number as Russian Ruble currency (no decimals). Null = unknown cost → "—" (AP#8: money, never 0). */
export function formatCurrency(value: number | null): string {
  if (value === null) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

/** Format week label: "2025-W44" -> "W44" */
export function formatWeekShort(week: string): string {
  return week.split('-')[1] || week
}
