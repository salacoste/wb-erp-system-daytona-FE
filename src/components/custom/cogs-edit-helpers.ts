/**
 * CogsEditDialog helpers - formatters and labels
 * Extracted from CogsEditDialog.tsx for file size compliance
 * Story 5.2-fe: COGS Edit Dialog
 */

import { formatCogsCost } from '@/lib/formatters'

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
 * Delegates to canonical formatCogsCost (2 fixed decimal places, NaN → "—").
 */
export function formatCurrencyRu(value: number): string {
  return formatCogsCost(value)
}

export const sourceLabels: Record<string, string> = {
  manual: 'Ручной ввод',
  import: 'Импорт из файла',
  system: 'Системный пересчёт',
}
