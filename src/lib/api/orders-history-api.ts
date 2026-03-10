/**
 * Orders History & Sync API Client
 * Extracted from orders.ts for file size compliance (Epic 74)
 *
 * History endpoints (local, WB native, full merged) and sync operations.
 */

import { apiClient } from '../api-client'
import type { TriggerSyncResponse, SyncStatusResponse } from '@/types/orders'
import type {
  LocalHistoryResponse,
  WbHistoryResponse,
  FullHistoryResponse,
} from '@/types/orders-history'

// ============================================================================
// Order History APIs
// ============================================================================

/**
 * Get local status history for order
 * GET /v1/orders/:orderId/history
 *
 * @param orderId - WB Order ID
 * @returns Local status history with current status and summary
 */
export async function getOrderHistory(orderId: string): Promise<LocalHistoryResponse> {
  console.info('[Orders API] Fetching local history:', orderId)

  return apiClient.get<LocalHistoryResponse>(`/v1/orders/${orderId}/history`, {
    skipDataUnwrap: true,
  })
}

/**
 * Get WB native status history for order
 * GET /v1/orders/:orderId/wb-history
 *
 * @param orderId - WB Order ID
 * @returns WB native status history with 40+ detailed status codes
 */
export async function getWbHistory(orderId: string): Promise<WbHistoryResponse> {
  console.info('[Orders API] Fetching WB history:', orderId)

  return apiClient.get<WbHistoryResponse>(`/v1/orders/${orderId}/wb-history`, {
    skipDataUnwrap: true,
  })
}

/**
 * Get merged full history (local + WB native)
 * GET /v1/orders/:orderId/full-history
 *
 * @param orderId - WB Order ID
 * @returns Merged history sorted by timestamp with source discriminator
 */
export async function getFullHistory(orderId: string): Promise<FullHistoryResponse> {
  console.info('[Orders API] Fetching full history:', orderId)

  return apiClient.get<FullHistoryResponse>(`/v1/orders/${orderId}/full-history`, {
    skipDataUnwrap: true,
  })
}

// ============================================================================
// Sync Operations
// ============================================================================

/**
 * Trigger manual orders sync
 * POST /v1/orders/sync
 *
 * @returns Job info with ID for status polling
 */
export async function triggerOrdersSync(): Promise<TriggerSyncResponse> {
  console.info('[Orders API] Triggering sync')

  return apiClient.post<TriggerSyncResponse>('/v1/orders/sync', {})
}

/** Backfill request params (Issue #2 - FBS Empty State) */
export interface BackfillParams {
  dateFrom: string
  dateTo: string
}

/** Backfill response from POST /v1/orders/backfill */
export interface BackfillResponse {
  jobId: string
  message: string
  dateFrom: string
  dateTo: string
  days: number
}

/**
 * Trigger historical orders backfill (up to 90 days)
 * POST /v1/orders/backfill
 * Issue #2: FBS Orders Empty State - allows loading historical data
 */
export async function triggerOrdersBackfill(params: BackfillParams): Promise<BackfillResponse> {
  console.info('[Orders API] Triggering backfill:', params)

  return apiClient.post<BackfillResponse>('/v1/orders/backfill', params)
}

/**
 * Get orders sync status
 * GET /v1/orders/sync-status
 *
 * @returns Current sync configuration and last/next sync timestamps
 */
export async function getOrdersSyncStatus(): Promise<SyncStatusResponse> {
  return apiClient.get<SyncStatusResponse>('/v1/orders/sync-status')
}
