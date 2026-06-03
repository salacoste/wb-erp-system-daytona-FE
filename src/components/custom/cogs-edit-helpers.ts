/**
 * CogsEditDialog helpers - formatters and labels
 * Extracted from CogsEditDialog.tsx for file size compliance
 * Story 5.2-fe: COGS Edit Dialog
 */

/** Format date to Russian locale (dd.mm.yyyy) */
export function formatDateRu(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

/**
 * Format currency to Russian locale with RUB symbol.
 * NOTE: distinct from the same-named `formatCurrencyRu` in `useCogsHistoryFull.ts`, which
 * additionally guards null/undefined for display.
 */
export function formatCurrencyRu(value: number): string {
  // CogsEditDialog feeds record.unit_cost_rub here, which the cogs-history normalizer maps to NaN
  // for an invalid/missing backend cost (honest sentinel, NOT 0 — anti-pattern #8). Render "—".
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export const sourceLabels: Record<string, string> = {
  manual: 'Ручной ввод',
  import: 'Импорт из файла',
  system: 'Системный пересчёт',
}
