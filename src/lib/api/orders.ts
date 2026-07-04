/**
 * Orders API Client
 * Story 40.1-FE: TypeScript Types & API Client Foundation
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * API functions for orders list and details.
 * History/sync operations: see orders-history-api.ts
 */

import { apiClient } from '../api-client'
import { normalizeOrdersResponse } from './orders-normalizer'
import { normalizeOrderDetail } from './orders-detail-normalizer'
import { logger } from '@/lib/logger'
import type {
  OrdersListParams,
  OrdersListResponse,
  OrderFbsDetails,
  OrderOperationalStatus,
  UpdateOrderOperationalStatusResponse,
} from '@/types/orders'

// Barrel re-exports from extracted module (history, sync, backfill)
export {
  getOrderHistory,
  getWbHistory,
  getFullHistory,
  triggerOrdersSync,
  triggerOrdersBackfill,
  getOrdersSyncStatus,
  type BackfillParams,
  type BackfillResponse,
} from './orders-history-api'

// Barrel re-export — order action mutations (Stories O2 / O3 / O4)
export { confirmOrder } from './orders-actions'

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

  logger.debug('[Orders API] Fetching orders:', params)

  const raw = await apiClient.get<unknown>(url, {
    skipDataUnwrap: true,
  })

  const response = normalizeOrdersResponse(raw)

  logger.debug('[Orders API] Orders response:', {
    count: response.items.length,
    total: response.pagination.total,
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
  logger.debug('[Orders API] Fetching order:', orderId)

  const raw = await apiClient.get<unknown>(`/v1/orders/${orderId}`)
  return normalizeOrderDetail(raw)
}

// ============================================================================
// Operational Status (Story O1)
// ============================================================================

/**
 * Update an order's operational status.
 * PATCH /v1/orders/:orderUuid/operational-status
 *
 * Story O1: `orderUuid` is the OrderFbs UUID (order.id), NOT the WB orderId.
 * Backend enforces the state machine; a 400 is returned on an invalid transition
 * (the message lists allowed targets — surfaced to the user by the mutation hook).
 * AP#10: opaque UUID passed through String().
 *
 * @param orderUuid - OrderFbs UUID (order.id)
 * @param status - target operational status
 * @returns { id, operationalStatus, operationalStatusUpdatedAt }
 */
export async function updateOrderOperationalStatus(
  orderUuid: string,
  status: OrderOperationalStatus
): Promise<UpdateOrderOperationalStatusResponse> {
  const url = `/v1/orders/${String(orderUuid)}/operational-status`
  logger.debug('[Orders API] Updating operational status:', { orderUuid, status })

  return apiClient.patch<UpdateOrderOperationalStatusResponse>(url, { status })
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
