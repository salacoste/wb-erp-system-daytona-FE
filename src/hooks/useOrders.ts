/**
 * React Query Hooks for Orders Module
 * Story 40.2-FE: React Query Hooks for Orders Module
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Hooks for orders list, details, sync operations.
 * Uses ordersQueryKeys from API client for cache management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getOrders,
  getOrderById,
  triggerOrdersSync,
  getOrdersSyncStatus,
  ordersQueryKeys,
} from '@/lib/api/orders'
import type {
  OrdersListParams,
  OrdersListResponse,
  OrderFbsDetails,
  TriggerSyncResponse,
  SyncStatusResponse,
} from '@/types/orders'

// Re-export query keys for external use
export { ordersQueryKeys }

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
// Sync Mutation Hook
// ============================================================================

export interface UseOrdersSyncOptions {
  /** Callback on successful sync trigger */
  onSuccess?: (data: TriggerSyncResponse) => void
  /** Callback on error */
  onError?: (error: Error) => void
}

/**
 * Hook to trigger manual orders sync
 * Invalidates sync status on success
 */
export function useOrdersSync(options: UseOrdersSyncOptions = {}) {
  const queryClient = useQueryClient()

  return useMutation<TriggerSyncResponse, Error, void>({
    mutationFn: triggerOrdersSync,
    onSuccess: data => {
      console.info('[Orders] Sync triggered:', data.jobId)
      queryClient.invalidateQueries({ queryKey: ordersQueryKeys.syncStatus() })
      options.onSuccess?.(data)
    },
    onError: error => {
      console.error('[Orders] Sync failed:', error)
      options.onError?.(error)
    },
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
    console.info('[Orders] Invalidating all orders queries')
    queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all })
  }
}
