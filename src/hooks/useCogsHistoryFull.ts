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
import type { CogsHistoryResponse } from '@/types/cogs'
import { normalizeCogsHistoryResponse } from '@/lib/api/cogs-history-normalizer'
import { logger } from '@/lib/logger'

// Re-export display helpers for backward compatibility
export {
  formatDateRu,
  formatCurrencyRu,
  getSourceLabel,
  getSourceIcon,
  analyzeVersionChain,
  formatWeeksCount,
} from './useCogsHistoryDisplay'

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
        logger.debug(`[COGS History Full] Fetching COGS history for nm_id: ${nmId}`, {
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

        logger.debug('[COGS History Full] Response received:', {
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
        logger.error(`[COGS History Full] Failed to fetch for ${nmId}:`, error)
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
