/**
 * Hook for assigning COGS to individual products
 * Story 4.1: Single Product COGS Assignment Interface
 * Epic 18 Backend API Integration
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { CogsAssignmentRequest, ProductWithCogs } from '@/types/api'
import { logger } from '@/lib/logger'

// Re-export utils for consumers
export {
  validateCogsAssignment,
  formatCogs,
  getMissingDataReasonMessage,
} from './useSingleCogsAssignment-utils'

export interface SingleCogsAssignmentParams {
  nmId: string
  cogs: CogsAssignmentRequest
}

/**
 * Hook to assign COGS to a single product
 */
export function useSingleCogsAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: SingleCogsAssignmentParams): Promise<ProductWithCogs> => {
      const { nmId, cogs } = params

      try {
        logger.debug(`[COGS Assignment] Assigning COGS to product ${nmId}:`, {
          unit_cost_rub: cogs.unit_cost_rub,
          valid_from: cogs.valid_from,
          source: cogs.source,
        })

        const response = await apiClient.post<ProductWithCogs>(`/v1/products/${nmId}/cogs`, cogs)

        logger.debug('[COGS Assignment] COGS assigned successfully:', {
          nm_id: response.nm_id,
          has_cogs: response.has_cogs,
          cogs_id: response.cogs?.id,
          current_margin_pct: response.current_margin_pct,
          missing_data_reason: response.missing_data_reason,
        })

        return response
      } catch (error) {
        logger.error(`[COGS Assignment] Failed to assign COGS to product ${nmId}:`, error)
        throw error
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', variables.nmId] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })

      const marginPct = data.current_margin_pct
      if (marginPct != null && typeof marginPct === 'number' && Number.isFinite(marginPct)) {
        logger.debug(`[COGS Assignment] Margin: ${marginPct.toFixed(2)}%`) // locale-percent-allow: debug log (not user-facing)
      } else if (data.missing_data_reason) {
        logger.debug(`[COGS Assignment] Margin: Not available (${data.missing_data_reason})`)
      }
    },
    onError: (error, variables) => {
      logger.error(`[COGS Assignment] Failed to assign COGS to product ${variables.nmId}:`, error)
    },
  })
}

/**
 * Hook to update COGS for a product (creates new version)
 * Uses same endpoint as assignment, but creates new temporal version
 */
export function useUpdateCogs() {
  return useSingleCogsAssignment()
}
