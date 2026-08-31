/**
 * Pure helpers for EvaluationsList.
 * Extracted per proactive-extraction discipline (target ≤150 lines for EvaluationsList.tsx).
 * Story 110.2-FE. F-2 (Story 110.2-FE 1st-pass): formatMapeValue replaced with formatMapeDisplay
 * using formatPercentage (Russian locale) for locale consistency — no more English decimal dot.
 * Migrated Story 171.7-FE: route-local status-badge token map (registry className-field detach).
 */

import { formatPercentage } from '@/lib/utils'
import type { EvaluationEntry } from '@/types/ai/evaluations'
import type { ModelStatus } from '@/types/ai/models'

export type SortDirection = 'asc' | 'desc'
export type SortColumn = 'mapeUnits' | 'mapeRevenue'

/**
 * Route-local status-badge overlay for EvaluationsHeaderCard (Story 171.7-FE).
 * Hue-preserving mirror of the registry badge tokens (171.6 semantic canon):
 * green→success, blue→information, amber→warning, red→error, gray→muted.
 * Story 174.2-FE completed the detach: the shared registry config's className
 * field was removed and replaced by registry-local maps (this one, the
 * performance subroute map, and MODEL_LIST_BADGE_CLASS at the registry root).
 * Labels stay sourced from STATUS_BADGE_CONFIG
 * (single label source of truth, WCAG 2.1 AA text-first).
 */
export const EVALUATION_STATUS_BADGE_CLASS: Record<ModelStatus, string> = {
  active: 'border-status-success/40 bg-status-success/10 text-status-success',
  training: 'border-status-information/40 bg-status-information/10 text-status-information',
  degraded: 'border-status-warning/40 bg-status-warning/10 text-status-warning',
  retired: 'border-border bg-muted text-muted-foreground',
  rolled_back: 'border-border bg-muted text-muted-foreground',
  failed: 'border-status-error/40 bg-status-error/10 text-status-error',
  deprecated: 'border-border bg-muted text-muted-foreground',
}

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
