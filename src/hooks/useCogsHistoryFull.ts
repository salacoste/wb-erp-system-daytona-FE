/**
 * Hook for fetching COGS history with full metadata
 * Story 5.1-fe: View COGS History
 * Backend Endpoint: GET /v1/cogs/history
 *
 * AC: 4, 5, 6, 14
 * Reference: frontend/docs/stories/epic-5/story-5.1-fe-cogs-history-view.md
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { CogsHistoryResponse, CogsHistoryItem, VersionChainInfo } from '@/types/cogs'
import { normalizeCogsHistoryResponse } from '@/lib/api/cogs-history-normalizer'

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
 * NOTE: distinct from the same-named `formatCurrencyRu` in `cogs-edit-helpers.ts` — this
 * display variant guards null/undefined (→ '—'); the helper variant expects a valid number.
 * @example formatCurrencyRu(1250.5) -> '1 250,50 ₽'
 */
export function formatCurrencyRu(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  // NaN is the cogs-history normalizer's "invalid cost" sentinel (anti-pattern #8). Intl.format(NaN)
  // does NOT throw (it returns "не число ₽"), so the try/catch below can't catch it — guard explicitly.
  // (Matches the sibling formatters fixed in iter-136; closes the drift that left this copy unguarded.)
  if (!Number.isFinite(value)) return '—'
  try {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return '—'
  }
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

export interface UseCogsHistoryOptions {
  limit?: number
  cursor?: string
  include_deleted?: boolean
}

/**
 * Hook to fetch COGS history with full metadata (product name, current COGS, etc.)
 *
 * Uses the new /v1/cogs/history endpoint which returns:
 * - data: Array of COGS versions with affected_weeks
 * - meta: Product name, current COGS, total versions
 * - pagination: cursor-based pagination
 *
 * @example
 * const { data, isLoading, isError } = useCogsHistoryFull('321678606', { limit: 25 });
 */
export function useCogsHistoryFull(nmId: string | undefined, options: UseCogsHistoryOptions = {}) {
  const { limit = 25, cursor, include_deleted = false } = options

  return useQuery({
    queryKey: ['cogs-history-full', nmId, { limit, cursor, include_deleted }],
    queryFn: async (): Promise<CogsHistoryResponse> => {
      if (!nmId) {
        throw new Error('Product ID is required')
      }

      try {
        console.info(`[COGS History Full] Fetching COGS history for nm_id: ${nmId}`, {
          limit,
          cursor,
          include_deleted,
        })

        // Build query params
        const params = new URLSearchParams()
        params.set('nm_id', nmId)
        params.set('limit', String(limit))
        if (cursor) params.set('cursor', cursor)
        if (include_deleted) params.set('include_deleted', 'true')

        // Validation F-36: this endpoint returns the full wrapper { data, meta,
        // pagination } and the page reads all three siblings (data.meta.product_name,
        // data.pagination.total, …). apiClient's default `{ data }` unwrap would return
        // ONLY the inner array → data.meta/data.pagination undefined → the /cogs/history
        // page rendered its empty state even when versions exist. skipDataUnwrap keeps
        // the wrapper. (Same double-unwrap class as F-30/F-32.)
        const response = await apiClient.get<CogsHistoryResponse>(
          `/v1/cogs/history?${params.toString()}`,
          { skipDataUnwrap: true }
        )

        console.info('[COGS History Full] Response received:', {
          nm_id: nmId,
          versions_count: response.data?.length || 0,
          total: response.pagination?.total,
          has_more: response.pagination?.has_more,
          product_name: response.meta?.product_name,
        })

        // F-37: coerce the string-typed `unit_cost_rub` ("500") to a number at the
        // boundary so no component sees a string (fixes CogsEditDialog's number-vs-string
        // strict-compare; aligns runtime with the `number` type).
        return normalizeCogsHistoryResponse(response)
      } catch (error) {
        console.error(`[COGS History Full] Failed to fetch for ${nmId}:`, error)
        throw error
      }
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
    enabled: !!nmId,
  })
}
