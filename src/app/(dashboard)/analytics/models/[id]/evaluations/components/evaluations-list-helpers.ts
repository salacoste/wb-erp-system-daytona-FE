/**
 * Pure helpers for EvaluationsList.
 * Extracted per proactive-extraction discipline (target ≤150 lines for EvaluationsList.tsx).
 * Story 110.2-FE. F-2 (Story 110.2-FE 1st-pass): formatMapeValue replaced with formatMapeDisplay
 * using formatPercentage (Russian locale) for locale consistency — no more English decimal dot.
 */

import { formatPercentage } from '@/lib/utils'
import type { EvaluationEntry } from '@/types/ai/evaluations'

export type SortDirection = 'asc' | 'desc'
export type SortColumn = 'mapeUnits' | 'mapeRevenue'

/**
 * Sort evaluation entries by a MAPE column.
 * Nulls go last regardless of direction (AP#8 discipline — null is not 0).
 * Story 110.2-FE AC-5: default is mapeUnits ASC (best performers first).
 */
export function sortEvaluationsByMape(
  entries: EvaluationEntry[],
  column: SortColumn,
  direction: SortDirection
): EvaluationEntry[] {
  return [...entries].sort((a, b) => {
    const aVal = a[column]
    const bVal = b[column]
    // Nulls last regardless of direction.
    if (aVal === null && bVal === null) return 0
    if (aVal === null) return 1
    if (bVal === null) return -1
    return direction === 'asc' ? aVal - bVal : bVal - aVal
  })
}

/**
 * Format a nullable MAPE value (0-100 scale) for display in Russian locale.
 * AP#8: null → '—', never '0%'.
 * Uses formatPercentage (ru-RU Intl) for locale consistency across dashboard.
 * F-2 fix: replaced toFixed(1)% (English decimal dot) with Intl ru-RU formatter.
 */
export function formatMapeDisplay(value: number | null): string {
  if (value === null) return '—'
  return formatPercentage(value)
}
