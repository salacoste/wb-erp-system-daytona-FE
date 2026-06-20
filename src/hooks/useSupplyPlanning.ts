/**
 * Supply Planning React Query Hooks
 * Epic 6 - Supply Planning & Stockout Prevention
 * Backend: Epic 28 - Supply Planning Analytics API
 * Reference: docs/stories/epic-28/README.md
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupplyPlanning } from '@/lib/api/supply-planning'
import type { SupplyPlanningQueryParams, SupplyPlanningResponse } from '@/types/supply-planning'
import {
  supplyPlanningQueryKeys,
  type UseSupplyPlanningOptions,
  SUPPLY_STALE_TIME,
  SUPPLY_GC_TIME,
  SUPPLY_PREFETCH_STALE_TIME,
} from './useSupplyPlanning-utils'
import { logger } from '@/lib/logger'

// Re-export for consumers
export { supplyPlanningQueryKeys, type UseSupplyPlanningOptions } from './useSupplyPlanning-utils'

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch supply planning analytics data
 *
 * Returns SKU-level inventory planning with stockout risk predictions,
 * reorder recommendations, and velocity trends.
 */
export function useSupplyPlanning(
  params: SupplyPlanningQueryParams = {},
  options: UseSupplyPlanningOptions = {}
) {
  const { enabled = true, refetchInterval, staleTime = SUPPLY_STALE_TIME } = options

  return useQuery<SupplyPlanningResponse, Error>({
    queryKey: supplyPlanningQueryKeys.list(params),
    queryFn: () => getSupplyPlanning(params),
    enabled,
    staleTime,
    gcTime: SUPPLY_GC_TIME,
    refetchOnWindowFocus: true,
    refetchInterval,
    retry: 2,
  })
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/** Hook to fetch only stockout risk SKUs */
export function useStockoutRisks(
  options: Omit<SupplyPlanningQueryParams, 'show_only'> & UseSupplyPlanningOptions = {}
) {
  const { enabled, refetchInterval, staleTime, ...params } = options
  return useSupplyPlanning(
    { ...params, show_only: 'stockout_risk' },
    { enabled, refetchInterval, staleTime }
  )
}

/** Hook to fetch SKUs needing reorder */
export function useReorderNeeded(
  options: Omit<SupplyPlanningQueryParams, 'show_only'> & UseSupplyPlanningOptions = {}
) {
  const { enabled, refetchInterval, staleTime, ...params } = options
  return useSupplyPlanning(
    { ...params, show_only: 'reorder_needed' },
    { enabled, refetchInterval, staleTime }
  )
}

/** Hook to fetch supply planning summary only (limit=1) */
export function useSupplyPlanningSummary(options: UseSupplyPlanningOptions = {}) {
  return useSupplyPlanning({ limit: 1 }, options)
}

// ============================================================================
// Helper Hooks
// ============================================================================

/** Hook to invalidate all supply planning queries */
export function useInvalidateSupplyPlanningQueries() {
  const queryClient = useQueryClient()
  return () => {
    logger.debug('[Supply Planning] Invalidating all supply planning queries')
    queryClient.invalidateQueries({ queryKey: supplyPlanningQueryKeys.all })
  }
}

/** Hook to prefetch supply planning data */
export function usePrefetchSupplyPlanning() {
  const queryClient = useQueryClient()
  return (params: SupplyPlanningQueryParams = {}) => {
    queryClient.prefetchQuery({
      queryKey: supplyPlanningQueryKeys.list(params),
      queryFn: () => getSupplyPlanning(params),
      staleTime: SUPPLY_PREFETCH_STALE_TIME,
    })
  }
}
