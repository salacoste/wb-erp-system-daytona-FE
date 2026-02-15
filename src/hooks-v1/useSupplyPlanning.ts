/**
 * Supply Planning React Query Hooks
 * Epic 6 - Supply Planning & Stockout Prevention
 * Backend: Epic 28 - Supply Planning Analytics API
 * Reference: docs/stories/epic-28/README.md
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupplyPlanning } from '@/lib/api/supply-planning'
import type {
  SupplyPlanningQueryParams,
  SupplyPlanningResponse,
} from '@/types/supply-planning'

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Query keys for supply planning
 * Follows TanStack Query v5 patterns with factory functions
 */
export const supplyPlanningQueryKeys = {
  /** Base key for all supply planning queries */
  all: ['supply-planning'] as const,

  /** Key for supply planning list queries */
  list: (params: SupplyPlanningQueryParams) =>
    [...supplyPlanningQueryKeys.all, 'list', params] as const,

  /** Key for specific SKU detail (for future expansion) */
  detail: (skuId: string) =>
    [...supplyPlanningQueryKeys.all, 'detail', skuId] as const,
}

// ============================================================================
// Query Hooks
// ============================================================================

export interface UseSupplyPlanningOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Refetch interval in milliseconds */
  refetchInterval?: number
  /** Stale time in milliseconds (default: 60000 = 1 min) */
  staleTime?: number
}

/**
 * Hook to fetch supply planning analytics data
 *
 * Returns SKU-level inventory planning with stockout risk predictions,
 * reorder recommendations, and velocity trends.
 *
 * @param params - Query parameters for filtering and sorting
 * @param options - Hook options (enabled, refetchInterval, staleTime)
 * @returns Query result with supply planning data
 *
 * @example
 * // Basic usage - fetch all SKUs with default params
 * const { data, isLoading, error } = useSupplyPlanning();
 *
 * @example
 * // Filter to show only stockout risks, sorted by urgency
 * const { data } = useSupplyPlanning({
 *   show_only: 'stockout_risk',
 *   sort_by: 'days_until_stockout',
 *   sort_order: 'asc',
 * });
 *
 * @example
 * // Custom velocity calculation period and safety stock
 * const { data } = useSupplyPlanning({
 *   velocity_weeks: 8,       // 8 weeks avg for velocity
 *   safety_stock_days: 21,   // 3 weeks safety stock
 *   limit: 200,              // Get top 200 SKUs
 * });
 */
export function useSupplyPlanning(
  params: SupplyPlanningQueryParams = {},
  options: UseSupplyPlanningOptions = {},
) {
  const {
    enabled = true,
    refetchInterval,
    staleTime = 60000, // 1 minute - supply planning data doesn't change frequently
  } = options

  return useQuery<SupplyPlanningResponse, Error>({
    queryKey: supplyPlanningQueryKeys.list(params),
    queryFn: () => getSupplyPlanning(params),
    enabled,
    staleTime,
    gcTime: 300000, // 5 minutes cache (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchInterval,
    retry: 2,
  })
}

/**
 * Hook to fetch only stockout risk SKUs
 *
 * Convenience wrapper that pre-filters to show_only: 'stockout_risk'
 *
 * @param options - Additional query params and hook options
 * @returns Query result with at-risk SKUs
 *
 * @example
 * const { data: atRiskSkus, isLoading } = useStockoutRisks({
 *   sort_by: 'days_until_stockout',
 *   sort_order: 'asc',
 *   limit: 50,
 * });
 */
export function useStockoutRisks(
  options: Omit<SupplyPlanningQueryParams, 'show_only'> &
    UseSupplyPlanningOptions = {},
) {
  const { enabled, refetchInterval, staleTime, ...params } = options

  return useSupplyPlanning(
    { ...params, show_only: 'stockout_risk' },
    { enabled, refetchInterval, staleTime },
  )
}

/**
 * Hook to fetch SKUs needing reorder
 *
 * Convenience wrapper that pre-filters to show_only: 'reorder_needed'
 *
 * @param options - Additional query params and hook options
 * @returns Query result with SKUs that need reordering
 *
 * @example
 * const { data: reorderList, isLoading } = useReorderNeeded({
 *   sort_by: 'reorder_quantity',
 *   sort_order: 'desc',
 * });
 */
export function useReorderNeeded(
  options: Omit<SupplyPlanningQueryParams, 'show_only'> &
    UseSupplyPlanningOptions = {},
) {
  const { enabled, refetchInterval, staleTime, ...params } = options

  return useSupplyPlanning(
    { ...params, show_only: 'reorder_needed' },
    { enabled, refetchInterval, staleTime },
  )
}

/**
 * Hook to fetch supply planning summary only
 *
 * Uses limit=0 to minimize data transfer when only summary stats are needed.
 * Useful for dashboard widgets and overview cards.
 *
 * @param options - Hook options
 * @returns Query result with summary statistics
 *
 * @example
 * const { data } = useSupplyPlanningSummary();
 * console.log(data?.summary.stockout_critical); // Number of critical SKUs
 */
export function useSupplyPlanningSummary(
  options: UseSupplyPlanningOptions = {},
) {
  return useSupplyPlanning(
    { limit: 1 }, // Minimal data, we just need summary
    options,
  )
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Hook to invalidate all supply planning queries
 * Use after data updates to refresh the cache
 *
 * @returns Function to invalidate all supply planning queries
 *
 * @example
 * const invalidateSupplyPlanning = useInvalidateSupplyPlanningQueries();
 *
 * // After manual stock update or import
 * invalidateSupplyPlanning();
 */
export function useInvalidateSupplyPlanningQueries() {
  const queryClient = useQueryClient()

  return () => {
    console.info('[Supply Planning] Invalidating all supply planning queries')
    queryClient.invalidateQueries({ queryKey: supplyPlanningQueryKeys.all })
  }
}

/**
 * Hook to prefetch supply planning data
 * Use for optimistic loading when user is likely to navigate to supply planning page
 *
 * @returns Function to prefetch supply planning data
 *
 * @example
 * const prefetchSupplyPlanning = usePrefetchSupplyPlanning();
 *
 * // Prefetch on hover over navigation link
 * <Link onMouseEnter={() => prefetchSupplyPlanning()}>
 *   Supply Planning
 * </Link>
 */
export function usePrefetchSupplyPlanning() {
  const queryClient = useQueryClient()

  return (params: SupplyPlanningQueryParams = {}) => {
    queryClient.prefetchQuery({
      queryKey: supplyPlanningQueryKeys.list(params),
      queryFn: () => getSupplyPlanning(params),
      staleTime: 60000,
    })
  }
}
