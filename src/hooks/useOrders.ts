/**
 * React Query Hooks for Orders Module
 * Story 40.2-FE: React Query Hooks for Orders Module
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Query hooks for orders list, details, sync status.
 * Mutation hooks extracted to ./useOrdersMutations.ts.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getOrders, getOrderById, getOrdersSyncStatus, ordersQueryKeys } from '@/lib/api/orders'
import type {
  OrdersListParams,
  OrdersListResponse,
  OrderFbsDetails,
  SyncStatusResponse,
} from '@/types/orders'
import { logger } from '@/lib/logger'

// Re-export query keys for external use
export { ordersQueryKeys } from '@/lib/api/orders'

// Re-export mutation hooks — preserve consumer API
export {
  useOrdersSync,
  useOrdersBackfill,
  useUpdateOrderOperationalStatus,
} from './useOrdersMutations'
export type {
  UseOrdersSyncOptions,
  UseOrdersBackfillOptions,
  UpdateOrderOperationalStatusInput,
} from './useOrdersMutations'

// ============================================================================
// Orders List Hook
// ============================================================================

export interface UseOrdersOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Refetch interval in ms */
  refetchInterval?: number
}

/**
 * Hook to fetch orders list with filters and pagination
 * Cache config: staleTime 30s, gcTime 5min
 */
export function useOrders(params: OrdersListParams = {}, options: UseOrdersOptions = {}) {
  const { enabled = true, refetchInterval } = options

  return useQuery<OrdersListResponse, Error>({
    queryKey: ordersQueryKeys.list(params),
    queryFn: () => getOrders(params),
    enabled,
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: true,
    refetchInterval,
    retry: 1,
  })
}

// ============================================================================
// Order Details Hook
// ============================================================================

export interface UseOrderDetailsOptions {
  /** Enable/disable the query */
  enabled?: boolean
}

/**
 * Hook to fetch single order details
 * Requires valid orderId to fetch
 */
export function useOrderDetails(orderId: string | null, options: UseOrderDetailsOptions = {}) {
  const { enabled = true } = options

  return useQuery<OrderFbsDetails, Error>({
    queryKey: ordersQueryKeys.detail(orderId ?? ''),
    queryFn: () => {
      if (!orderId) throw new Error('Order ID is required')
      return getOrderById(orderId)
    },
    enabled: enabled && !!orderId,
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}

// ============================================================================
// Sync Status Hook
// ============================================================================

/**
 * Hook to get orders sync status
 * Returns current sync configuration and last/next sync timestamps
 */
export function useOrdersSyncStatus() {
  return useQuery<SyncStatusResponse, Error>({
    queryKey: ordersQueryKeys.syncStatus(),
    queryFn: getOrdersSyncStatus,
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}

// ============================================================================
// Helper Hook: Invalidate All Orders Queries
// ============================================================================

/**
 * Hook to invalidate all orders queries
 * Use after sync completion or data changes
 */
export function useInvalidateOrdersQueries() {
  const queryClient = useQueryClient()

  return () => {
    logger.debug('[Orders] Invalidating all orders queries')
    queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all })
  }
}
