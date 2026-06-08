/**
 * FBO Orders React Query Hooks
 *
 * Hooks for FBO orders list, detail, aggregate, sync, and backfill.
 * Uses ordersFboQueryKeys from API client for cache management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getFboOrders,
  getFboOrderDetail,
  getFboOrdersAggregate,
  triggerFboOrdersSync,
  getFboOrdersSyncStatus,
  triggerFboOrdersBackfill,
  ordersFboQueryKeys,
} from '@/lib/api/orders-fbo'
import { logger } from '@/lib/logger'
import type { FboOrdersListParams, FboOrdersBackfillParams } from '@/types/orders-fbo'
import type {
  FboOrdersListResponse,
  OrderFboDetail,
  FboOrdersAggregateResponse,
  FboOrdersSyncStatusResponse,
  FboOrdersSyncTriggerResponse,
  FboOrdersBackfillResponse,
} from '@/types/orders-fbo'

export { ordersFboQueryKeys }

// --- List Hook ---

export interface UseFboOrdersOptions {
  enabled?: boolean
  refetchInterval?: number
}

/** Fetch paginated FBO orders list */
export function useOrdersFbo(params: FboOrdersListParams = {}, options: UseFboOrdersOptions = {}) {
  const { enabled = true, refetchInterval } = options
  return useQuery<FboOrdersListResponse, Error>({
    queryKey: ordersFboQueryKeys.list(params),
    queryFn: () => getFboOrders(params),
    enabled,
    staleTime: 60_000,
    gcTime: 300_000,
    refetchInterval,
    retry: 1,
  })
}

// --- Detail Hook ---

/** Fetch single FBO order detail */
export function useOrderFboDetail(orderId: string | null) {
  return useQuery<OrderFboDetail, Error>({
    queryKey: ordersFboQueryKeys.detail(orderId ?? ''),
    queryFn: () => {
      if (!orderId) throw new Error('Order ID is required')
      return getFboOrderDetail(orderId)
    },
    enabled: !!orderId,
    staleTime: 30_000,
    gcTime: 300_000,
    retry: 1,
  })
}

// --- Aggregate Hook ---

/** Fetch aggregated FBO order statistics */
export function useOrdersFboAggregate(params: FboOrdersListParams = {}) {
  return useQuery<FboOrdersAggregateResponse, Error>({
    queryKey: ordersFboQueryKeys.aggregate(params),
    queryFn: () => getFboOrdersAggregate(params),
    enabled: true,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
  })
}

// --- Sync Status Hook ---

/** Fetch FBO orders sync status with optional polling */
export function useOrdersFboSyncStatus(refetchInterval: number = 30_000) {
  return useQuery<FboOrdersSyncStatusResponse, Error>({
    queryKey: ordersFboQueryKeys.syncStatus(),
    queryFn: getFboOrdersSyncStatus,
    staleTime: 10_000,
    gcTime: 60_000,
    refetchInterval,
    retry: 1,
  })
}

// --- Sync Mutation Hook ---

export interface UseFboOrdersSyncOptions {
  onSuccess?: (data: FboOrdersSyncTriggerResponse) => void
  onError?: (error: Error) => void
}

/** Trigger manual FBO orders sync */
export function useSyncOrdersFbo(options: UseFboOrdersSyncOptions = {}) {
  const queryClient = useQueryClient()
  return useMutation<FboOrdersSyncTriggerResponse, Error, void>({
    mutationFn: triggerFboOrdersSync,
    onSuccess: data => {
      logger.debug('[FBO Orders] Sync triggered:', data.jobId)
      queryClient.invalidateQueries({ queryKey: ordersFboQueryKeys.all })
      options.onSuccess?.(data)
    },
    onError: error => {
      logger.error('[FBO Orders] Sync failed:', error)
      options.onError?.(error)
    },
  })
}

// --- Backfill Mutation Hook ---

export interface UseFboOrdersBackfillOptions {
  onSuccess?: (data: FboOrdersBackfillResponse) => void
  onError?: (error: Error) => void
}

/** Trigger historical FBO orders backfill (up to 90 days) */
export function useBackfillOrdersFbo(options: UseFboOrdersBackfillOptions = {}) {
  const queryClient = useQueryClient()
  return useMutation<FboOrdersBackfillResponse, Error, FboOrdersBackfillParams>({
    mutationFn: triggerFboOrdersBackfill,
    onSuccess: data => {
      logger.debug('[FBO Orders] Backfill triggered:', data.jobId)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ordersFboQueryKeys.all })
      }, 30_000)
      options.onSuccess?.(data)
    },
    onError: error => {
      logger.error('[FBO Orders] Backfill failed:', error)
      options.onError?.(error)
    },
  })
}
