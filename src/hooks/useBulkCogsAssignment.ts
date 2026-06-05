/**
 * Hook for bulk COGS assignment to multiple products
 * Story 4.2: Bulk COGS Assignment Capability
 * Epic 18 Backend API Integration
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { BulkCogsUploadRequest, BulkCogsResultSummary, BulkCogsItem } from '@/types/api'
import { normalizeBulkCogsResponse } from '@/lib/api/bulk-cogs-normalizer'

// Re-export utils for consumers
export { validateBulkCogsAssignment, createBulkCogsItems } from './useBulkCogsAssignment-utils'

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
        console.info(`[Bulk COGS Assignment] Assigning COGS to ${items.length} products`)

        if (items.length > 1000) {
          throw new Error(`Максимум 1000 товаров за один раз. Передано: ${items.length}`)
        }

        const request: BulkCogsUploadRequest = { items }

        console.info('[Bulk COGS Assignment] Request:', {
          items_count: items.length,
          sample_item: items[0],
        })

        // F-34: the endpoint returns the legacy { totalItems, createdItems, … } shape
        // today (not v2), so normalize BOTH shapes to the canonical summary. The old
        // `response.data.succeeded` read crashed on the legacy result (TypeError).
        const response = await apiClient.post<unknown>('/v1/products/cogs/bulk?format=v2', request)
        const summary = normalizeBulkCogsResponse(response)

        console.info('[Bulk COGS Assignment] Response:', {
          succeeded: summary.succeeded,
          failed: summary.failed,
          total: items.length,
        })

        return summary
      } catch (error) {
        console.error('[Bulk COGS Assignment] Failed:', error)
        throw error
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })

      const { succeeded, failed, results, marginRecalculation } = data

      console.log(`✅ Bulk COGS assignment completed:`)
      console.log(`   Succeeded: ${succeeded}/${variables.items.length}`)
      console.log(`   Failed: ${failed}/${variables.items.length}`)

      if (marginRecalculation) {
        console.log(`   Margin Recalculation:`)
        console.log(`     Triggered: ${marginRecalculation.triggered}`)
        console.log(`     Weeks: ${marginRecalculation.affectedWeeks.join(', ')}`)
        console.log(`     Task UUID: ${marginRecalculation.taskUuid}`)
      } else if (succeeded > 0) {
        console.log(`   Margin Recalculation: Not triggered (no sales data for uploaded COGS)`)
      }

      if (failed > 0) {
        const failedItems = results.filter(r => !r.success)
        console.warn('[Bulk COGS] Failed items:', failedItems)
      }
    },
    onError: (error, variables) => {
      console.error(`[Bulk COGS] Failed for ${variables.items.length} items:`, error)
    },
  })
}
