/**
 * Pure helpers for SKU Accuracy components.
 * Extracted per pure-function discipline (CLAUDE.md feedback memory).
 * Story 110.3-FE Task 4.
 */

import { formatPercentage } from '@/lib/utils'
import type { SkuAccuracyEntry } from '@/types/ai/evaluations'

export type SkuSortDirection = 'asc' | 'desc'
export type SkuSortColumn = 'avgAiMape' | 'avgNaiveMape' | 'aiAccuracyPercent'

/**
 * Sort SKU accuracy entries by a numeric column.
 * Nulls go last regardless of direction (AP#8 discipline — null is not 0).
 * Default: avgAiMape ASC (best AI performers first).
 */
export function sortSkuAccuracyEntries(
  entries: SkuAccuracyEntry[],
  column: SkuSortColumn,
  direction: SkuSortDirection
): SkuAccuracyEntry[] {
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
 * Format a nullable MAPE or percentage value for display in Russian locale.
 * AP#8: null → '—', never '0%'.
 * Uses formatPercentage (ru-RU Intl) for locale consistency.
 */
export function formatSkuMapeDisplay(value: number | null): string {
  if (value === null) return '—'
  return formatPercentage(value)
}
