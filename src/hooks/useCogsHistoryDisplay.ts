/**
 * COGS History display helpers
 * Story 5.1-fe: View COGS History
 */

import { formatCogsCost } from '@/lib/formatters'
import type { CogsHistoryItem, VersionChainInfo } from '@/types/cogs'

/**
 * Formats date to Russian locale (dd.mm.yyyy)
 * @example formatDateRu('2025-01-15') -> '15.01.2025'
 */
export function formatDateRu(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  } catch {
    return '—'
  }
}

/**
 * Formats currency to Russian locale with RUB symbol.
 * Delegates to canonical formatCogsCost (2 fixed decimal places, null/NaN → "—").
 * @example formatCurrencyRu(1250.5) -> '1 250,50 ₽'
 */
export function formatCurrencyRu(value: number | null | undefined): string {
  return formatCogsCost(value)
}

/**
 * Returns Russian label for COGS source
 * @example getSourceLabel('manual') -> 'Ручной ввод'
 */
export function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    manual: 'Ручной ввод',
    import: 'Импорт',
    system: 'Система',
  }
  return labels[source] || source
}

/**
 * Returns icon emoji for COGS source
 * @example getSourceIcon('manual') -> '✏️'
 */
export function getSourceIcon(source: string): string {
  const icons: Record<string, string> = {
    manual: '✏️',
    import: '📥',
    system: '⚙️',
  }
  return icons[source] || '📋'
}

/**
 * Analyzes version chain for delete confirmation logic
 * Story 5.3-fe: Delete COGS Entry
 */
export function analyzeVersionChain(
  item: CogsHistoryItem,
  allItems: CogsHistoryItem[]
): VersionChainInfo {
  const activeItems = allItems.filter(i => i.is_active)
  const sortedByDate = [...activeItems].sort(
    (a, b) => new Date(b.valid_from).getTime() - new Date(a.valid_from).getTime()
  )

  const isCurrentVersion = sortedByDate.length > 0 && sortedByDate[0].cogs_id === item.cogs_id
  const isOnlyVersion = activeItems.length === 1

  // Find previous version (next in chronologically sorted order)
  const currentIndex = sortedByDate.findIndex(i => i.cogs_id === item.cogs_id)
  const previousVersion =
    currentIndex < sortedByDate.length - 1 ? sortedByDate[currentIndex + 1] : undefined

  return {
    isCurrentVersion,
    hasPreviousVersion: !!previousVersion,
    isOnlyVersion,
    previousVersionCost: previousVersion?.unit_cost_rub,
    previousVersionDate: previousVersion?.valid_from,
  }
}

/**
 * Formats affected weeks count with Russian plural
 * @example formatWeeksCount(3) -> '3 недели'
 */
export function formatWeeksCount(count: number): string {
  const lastDigit = count % 10
  const lastTwoDigits = count % 100

  let suffix: string
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    suffix = 'недель'
  } else if (lastDigit === 1) {
    suffix = 'неделя'
  } else if (lastDigit >= 2 && lastDigit <= 4) {
    suffix = 'недели'
  } else {
    suffix = 'недель'
  }

  return `${count} ${suffix}`
}
