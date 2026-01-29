/**
 * Orders API Client
 * Story 40.1-FE: TypeScript Types & API Client Foundation
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * API functions for orders list, details, history, and sync operations.
 */

import { apiClient } from '../api-client'
import type {
  OrdersListParams,
  OrdersListResponse,
  OrderFbsDetails,
  TriggerSyncResponse,
  SyncStatusResponse,
} from '@/types/orders'
import type {
  LocalHistoryResponse,
  WbHistoryResponse,
  FullHistoryResponse,
} from '@/types/orders-history'

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Build query string from params object
 * Filters out undefined/null values
 */
function buildQueryString(params: OrdersListParams): string {
  const searchParams = new URLSearchParams()
  const entries = Object.entries(params) as [string, unknown][]

  for (const [key, value] of entries) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  }

  return searchParams.toString()
}

// ============================================================================
// Orders List & Details
// ============================================================================

/**
 * Get orders list with filters
 * GET /v1/orders
 *
 * @param params - Query parameters (date range, status filters, sorting, pagination)
 * @returns Paginated list of orders with query info
 */
export async function getOrders(params: OrdersListParams = {}): Promise<OrdersListResponse> {
  const queryString = buildQueryString(params)
  const url = queryString ? `/v1/orders?${queryString}` : '/v1/orders'

  console.info('[Orders API] Fetching orders:', params)

  const response = await apiClient.get<OrdersListResponse>(url, {
    skipDataUnwrap: true,
  })

  console.info('[Orders API] Orders response:', {
    count: response.items?.length ?? 0,
    total: response.pagination?.total ?? 0,
  })

  return response
}

/**
 * Get single order by ID
 * GET /v1/orders/:orderId
 *
 * @param orderId - WB Order ID (string for BigInt compatibility)
 * @returns Extended order details with address and brief history
 */
export async function getOrderById(orderId: string): Promise<OrderFbsDetails> {
  console.info('[Orders API] Fetching order:', orderId)

  return apiClient.get<OrderFbsDetails>(`/v1/orders/${orderId}`)
}

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

/**
 * Get orders sync status
 * GET /v1/orders/sync-status
 *
 * @returns Current sync configuration and last/next sync timestamps
 */
export async function getOrdersSyncStatus(): Promise<SyncStatusResponse> {
  return apiClient.get<SyncStatusResponse>('/v1/orders/sync-status')
}

// ============================================================================
// Query Keys Factory (for React Query)
// ============================================================================

export const ordersQueryKeys = {
  all: ['orders'] as const,
  lists: () => [...ordersQueryKeys.all, 'list'] as const,
  list: (params: OrdersListParams) => [...ordersQueryKeys.lists(), params] as const,
  details: () => [...ordersQueryKeys.all, 'detail'] as const,
  detail: (orderId: string) => [...ordersQueryKeys.details(), orderId] as const,
  history: (orderId: string) => [...ordersQueryKeys.all, 'history', orderId] as const,
  wbHistory: (orderId: string) => [...ordersQueryKeys.all, 'wb-history', orderId] as const,
  fullHistory: (orderId: string) => [...ordersQueryKeys.all, 'full-history', orderId] as const,
  syncStatus: () => [...ordersQueryKeys.all, 'sync-status'] as const,
}
