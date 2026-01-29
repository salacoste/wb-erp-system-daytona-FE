/**
 * React Query Hooks for Supplies Module
 * Story 53.2-FE: Supplies List Page
 * Epic 53-FE: Supply Management UI
 *
 * Hooks for supplies list, details, and sync operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getSupplies, getSupply, syncSupplies, suppliesQueryKeys } from '@/lib/api/supplies'
import type {
  SuppliesListParams,
  SuppliesListResponse,
  SupplyDetailResponse,
} from '@/types/supplies'

// Re-export query keys for external use
export { suppliesQueryKeys }

// =============================================================================
// Supplies List Hook
// =============================================================================

export interface UseSuppliesOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Refetch interval in ms */
  refetchInterval?: number
}

/**
 * Hook to fetch supplies list with filters and pagination
 * Cache config: staleTime 30s, gcTime 5min
 */
export function useSupplies(params: SuppliesListParams = {}, options: UseSuppliesOptions = {}) {
  const { enabled = true, refetchInterval } = options

  return useQuery<SuppliesListResponse, Error>({
    queryKey: suppliesQueryKeys.list(params),
    queryFn: () => getSupplies(params),
    enabled,
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: true,
    refetchInterval,
    retry: 1,
  })
}

// =============================================================================
// Supply Detail Hook
// =============================================================================

export interface UseSupplyDetailOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

/**
 * Hook to fetch single supply details
 * Requires valid supplyId to fetch
 */
export function useSupplyDetail(supplyId: string | null, options: UseSupplyDetailOptions = {}) {
  const { enabled = true } = options

  return useQuery<SupplyDetailResponse, Error>({
    queryKey: suppliesQueryKeys.detail(supplyId ?? ''),
    queryFn: () => {
      if (!supplyId) throw new Error('Supply ID is required')
      return getSupply(supplyId)
    },
    enabled: enabled && !!supplyId,
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}

// =============================================================================
// Sync Supplies Hook
// =============================================================================

/**
 * Hook to trigger manual supplies sync with WB
 * Invalidates supplies list on success
 * Rate limited: 1 request per 5 minutes
 */
export function useSyncSupplies() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: syncSupplies,
    onSuccess: data => {
      // Invalidate supplies list to refresh statuses
      queryClient.invalidateQueries({ queryKey: suppliesQueryKeys.all })

      if (data.statusChanges.length > 0) {
        toast.success(
          `Синхронизировано ${data.syncedCount} поставок, ${data.statusChanges.length} изменений статуса`
        )
      } else {
        toast.info('Статусы поставок актуальны')
      }
    },
    onError: error => {
      const errorMsg = error instanceof Error ? error.message : 'Ошибка синхронизации'

      if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('rate')) {
        toast.error('Слишком частые запросы. Подождите 5 минут.')
      } else {
        toast.error(errorMsg)
      }
    },
  })
}

// =============================================================================
// Helper Hook: Invalidate All Supplies Queries
// =============================================================================

/**
 * Hook to invalidate all supplies queries
 * Use after mutations or data changes
 */
export function useInvalidateSuppliesQueries() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: suppliesQueryKeys.all })
  }
}
