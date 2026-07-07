/**
 * CogsEditDialog helpers - formatters and labels
 * Extracted from CogsEditDialog.tsx for file size compliance
 * Story 5.2-fe: COGS Edit Dialog
 */

import { formatCogsCost } from '@/lib/formatters'
import { COGS_SOURCE_CONFIG } from '@/lib/cogs-source-config'

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

// BD-13 DRY: derived from the single source of truth at @/lib/cogs-source-config, so a new
// source updates the edit dialog automatically (no third map to keep in sync by hand).
export const sourceLabels: Record<string, string> = Object.fromEntries(
  Object.entries(COGS_SOURCE_CONFIG).map(([source, { label }]) => [source, label])
)
