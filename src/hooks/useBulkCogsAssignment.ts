/**
 * Hook for bulk COGS assignment to multiple products
 * Story 4.2: Bulk COGS Assignment Capability
 * Epic 18 Backend API Integration
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { BulkCogsUploadRequest, BulkCogsResultSummary, BulkCogsItem } from '@/types/api'
import { normalizeBulkCogsResponse } from '@/lib/api/bulk-cogs-normalizer'
import { logger } from '@/lib/logger'
import { toBulkCogsWireRequest } from './useBulkCogsAssignment-utils'

// Re-export utils for consumers
export {
  validateBulkCogsAssignment,
  createBulkCogsItems,
  toBulkCogsWireItem,
  toBulkCogsWireRequest,
} from './useBulkCogsAssignment-utils'

export interface BulkCogsAssignmentParams {
  items: BulkCogsItem[]
}

/**
 * Hook to assign COGS to multiple products in bulk
 */
export function useBulkCogsAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: BulkCogsAssignmentParams): Promise<BulkCogsResultSummary> => {
      const { items } = params

      try {
        logger.debug(`[Bulk COGS Assignment] Assigning COGS to ${items.length} products`)

        if (items.length > 1000) {
          throw new Error(`Максимум 1000 товаров за один раз. Передано: ${items.length}`)
        }

        const request: BulkCogsUploadRequest = { items }

        logger.debug('[Bulk COGS Assignment] Request:', {
          items_count: items.length,
          sample_item: items[0],
        })

        // F-34: the endpoint returns the legacy { totalItems, createdItems, … } shape
        // today (not v2), so normalize BOTH shapes to the canonical summary. The old
        // `response.data.succeeded` read crashed on the legacy result (TypeError).
        // BE-A-1: convert string nm_id → integer at the wire boundary (BE rejects string).
        const response = await apiClient.post<unknown>(
          '/v1/products/cogs/bulk?format=v2',
          toBulkCogsWireRequest(request)
        )
        const summary = normalizeBulkCogsResponse(response)

        logger.debug('[Bulk COGS Assignment] Response:', {
          succeeded: summary.succeeded,
          failed: summary.failed,
          total: items.length,
        })

        return summary
      } catch (error) {
        logger.error('[Bulk COGS Assignment] Failed:', error)
        throw error
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })

      const { succeeded, failed, results, marginRecalculation } = data

      logger.debug(`✅ Bulk COGS assignment completed:`)
      logger.debug(`   Succeeded: ${succeeded}/${variables.items.length}`)
      logger.debug(`   Failed: ${failed}/${variables.items.length}`)

      if (marginRecalculation) {
        logger.debug(`   Margin Recalculation:`)
        logger.debug(`     Triggered: ${marginRecalculation.triggered}`)
        logger.debug(`     Weeks: ${marginRecalculation.affectedWeeks.join(', ')}`)
        logger.debug(`     Task UUID: ${marginRecalculation.taskUuid}`)
      } else if (succeeded > 0) {
        logger.debug(`   Margin Recalculation: Not triggered (no sales data for uploaded COGS)`)
      }

      if (failed > 0) {
        const failedItems = results.filter(r => !r.success)
        logger.warn('[Bulk COGS] Failed items:', failedItems)
      }
    },
    onError: (error, variables) => {
      logger.error(`[Bulk COGS] Failed for ${variables.items.length} items:`, error)
    },
  })
}
