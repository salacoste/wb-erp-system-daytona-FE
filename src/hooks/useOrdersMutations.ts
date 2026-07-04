/**
 * React Query Mutation Hooks for Orders Module
 * Extracted from useOrders.ts for line-count compliance.
 *
 * Hooks for sync and backfill mutation operations.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  triggerOrdersSync,
  triggerOrdersBackfill,
  updateOrderOperationalStatus,
  ordersQueryKeys,
} from '@/lib/api/orders'
import type { BackfillParams, BackfillResponse } from '@/lib/api/orders'
import type {
  TriggerSyncResponse,
  OrderOperationalStatus,
  UpdateOrderOperationalStatusResponse,
} from '@/types/orders'
import { logger } from '@/lib/logger'

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
      logger.debug('[Orders] Sync triggered:', data.jobId)
      queryClient.invalidateQueries({ queryKey: ordersQueryKeys.syncStatus() })
      options.onSuccess?.(data)
    },
    onError: error => {
      logger.error('[Orders] Sync failed:', error)
      options.onError?.(error)
    },
  })
}

export interface UseOrdersBackfillOptions {
  /** Callback on successful backfill trigger */
  onSuccess?: (data: BackfillResponse) => void
  /** Callback on error */
  onError?: (error: Error) => void
}

/**
 * Hook to trigger historical orders backfill (up to 90 days)
 * Issue #2: Allows loading FBS data for periods before sync was enabled
 */
export function useOrdersBackfill(options: UseOrdersBackfillOptions = {}) {
  const queryClient = useQueryClient()

  return useMutation<BackfillResponse, Error, BackfillParams>({
    mutationFn: triggerOrdersBackfill,
    onSuccess: data => {
      logger.debug('[Orders] Backfill triggered:', data.jobId, data.days, 'days')
      // Invalidate orders queries after delay to allow processing
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all })
      }, 30000)
      options.onSuccess?.(data)
    },
    onError: error => {
      logger.error('[Orders] Backfill failed:', error)
      options.onError?.(error)
    },
  })
}

// ============================================================================
// Operational Status (Story O1)
// ============================================================================

/** Input for useUpdateOrderOperationalStatus */
export interface UpdateOrderOperationalStatusInput {
  /** OrderFbs UUID (order.id) — NOT the WB orderId */
  orderUuid: string
  /** Target operational status (must be in ALLOWED_TRANSITIONS[current]) */
  status: OrderOperationalStatus
}

/**
 * Hook to update an order's operational status.
 * Story O1: PATCH /v1/orders/:orderUuid/operational-status.
 * On success: invalidate orders lists + toast. On error: surface the backend
 * message (it lists the allowed transition targets on a 400).
 */
export function useUpdateOrderOperationalStatus() {
  const queryClient = useQueryClient()

  return useMutation<
    UpdateOrderOperationalStatusResponse,
    Error,
    UpdateOrderOperationalStatusInput
  >({
    mutationFn: ({ orderUuid, status }) => updateOrderOperationalStatus(orderUuid, status),
    onSuccess: data => {
      logger.debug('[Orders] Operational status updated:', data)
      queryClient.invalidateQueries({ queryKey: ordersQueryKeys.lists() })
      toast.success('Статус обновлён')
    },
    onError: error => {
      logger.error('[Orders] Operational status update failed:', error)
      // Backend 400 message lists allowed targets (e.g.
      // "Invalid transition: NEW -> DELIVERED. Allowed from NEW: ASSEMBLED, CANCELLED").
      toast.error(error.message || 'Не удалось обновить статус')
    },
  })
}
