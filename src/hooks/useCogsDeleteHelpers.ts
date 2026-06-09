/**
 * COGS Delete — Pure helper functions
 * Extracted from useCogsDelete.ts for file-size compliance (Epic 134-FE)
 */

import type { CogsHistoryItem, VersionChainInfo } from '@/types/cogs'

/**
 * Analyzes version chain for delete confirmation logic
 * Story 5.3-fe: Determine what warnings to show
 *
 * @param record - The COGS record being deleted
 * @param history - All COGS history items for this product
 */
export function analyzeVersionChain(
  record: CogsHistoryItem,
  history: CogsHistoryItem[]
): VersionChainInfo {
  // Check if this is the current version (no end date)
  const isCurrentVersion = record.valid_to === null

  // Find previous version (valid_to === this record's valid_from)
  const previousVersion = history.find(
    r => r.valid_to === record.valid_from && r.is_active && r.cogs_id !== record.cogs_id
  )
  const hasPreviousVersion = !!previousVersion

  // Check if this is the only active version
  const activeVersions = history.filter(r => r.is_active)
  const isOnlyVersion = activeVersions.length === 1

  return {
    isCurrentVersion,
    hasPreviousVersion,
    isOnlyVersion,
    previousVersionCost: previousVersion?.unit_cost_rub,
    previousVersionDate: previousVersion?.valid_from,
  }
}

/**
 * Formats date for display in Russian locale
 */
export function formatDateForDelete(dateStr: string | null): string {
  if (!dateStr) return 'текущий'
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
 * Formats currency for display in Russian locale
 */
export function formatCurrencyForDelete(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
