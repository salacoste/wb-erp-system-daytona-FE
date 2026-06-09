/**
 * Supplies API Client
 * Story 53.1-FE: TypeScript Types & API Client for Supplies
 * Epic 53-FE: Supply Management UI
 *
 * API functions for supplies list, details, and order management.
 * Document/sync operations: see supplies-documents.ts
 */

import { apiClient } from '../api-client'
import { logger } from '@/lib/logger'
import type {
  SuppliesListParams,
  SuppliesListResponse,
  SupplyDetailResponse,
  CreateSupplyRequest,
  CreateSupplyResponse,
  AddOrdersRequest,
  AddOrdersResponse,
  RemoveOrdersRequest,
  RemoveOrdersResponse,
  CloseSupplyResponse,
} from '@/types/supplies'
import { normalizeSuppliesListResponse, normalizeSupplyDetailResponse } from './supplies-normalizer'
import { buildQueryString } from './supplies-query-keys'

// Barrel re-exports from extracted modules
export { generateStickers, downloadDocument, syncSupplies } from './supplies-documents'
export { suppliesQueryKeys } from './supplies-query-keys'

// =============================================================================
// List & Detail Operations
// =============================================================================

/**
 * Get supplies list with filters
 * GET /v1/supplies
 */
export async function getSupplies(params: SuppliesListParams = {}): Promise<SuppliesListResponse> {
  const queryString = buildQueryString(params)
  const url = queryString ? `/v1/supplies?${queryString}` : '/v1/supplies'

  logger.debug('[Supplies API] Fetching supplies:', params)

  const raw = await apiClient.get<unknown>(url, { skipDataUnwrap: true })
  const response = normalizeSuppliesListResponse(raw)

  logger.debug('[Supplies API] Supplies response:', {
    count: response.items?.length ?? 0,
    total: response.pagination?.total ?? 0,
  })

  return response
}

/**
 * Get single supply by ID
 * GET /v1/supplies/:id
 */
export async function getSupply(supplyId: string): Promise<SupplyDetailResponse> {
  logger.debug('[Supplies API] Fetching supply:', supplyId)

  const raw = await apiClient.get<unknown>(`/v1/supplies/${supplyId}`, { skipDataUnwrap: true })
  return normalizeSupplyDetailResponse(raw)
}

// =============================================================================
// Create & Modify Operations
// =============================================================================

/**
 * Create new supply
 * POST /v1/supplies
 */
export async function createSupply(data: CreateSupplyRequest = {}): Promise<CreateSupplyResponse> {
  logger.debug('[Supplies API] Creating supply:', data)

  const response = await apiClient.post<CreateSupplyResponse>('/v1/supplies', data)

  logger.debug('[Supplies API] Supply created:', response.id)

  return response
}

/**
 * Add orders to supply (batch, max 1000)
 * POST /v1/supplies/:id/orders
 */
export async function addOrders(supplyId: string, orderIds: string[]): Promise<AddOrdersResponse> {
  logger.debug('[Supplies API] Adding orders:', {
    supplyId,
    orderCount: orderIds.length,
  })

  const response = await apiClient.post<AddOrdersResponse>(`/v1/supplies/${supplyId}/orders`, {
    orderIds,
  } as AddOrdersRequest)

  logger.debug('[Supplies API] Orders added:', {
    added: response.added,
    failed: response.failed,
  })

  return response
}

/**
 * Remove orders from supply
 * DELETE /v1/supplies/:id/orders
 * Note: Uses POST with _method=DELETE pattern for body support
 */
export async function removeOrders(
  supplyId: string,
  orderIds: string[]
): Promise<RemoveOrdersResponse> {
  logger.debug('[Supplies API] Removing orders:', {
    supplyId,
    orderCount: orderIds.length,
  })

  // Use POST with body since DELETE with body isn't well supported
  const response = await apiClient.post<RemoveOrdersResponse>(
    `/v1/supplies/${supplyId}/orders/remove`,
    { orderIds } as RemoveOrdersRequest
  )

  logger.debug('[Supplies API] Orders removed:', response.removedCount)

  return response
}

/**
 * Close supply (transition OPEN -> CLOSED)
 * POST /v1/supplies/:id/close
 */
export async function closeSupply(supplyId: string): Promise<CloseSupplyResponse> {
  logger.debug('[Supplies API] Closing supply:', supplyId)

  const response = await apiClient.post<CloseSupplyResponse>(`/v1/supplies/${supplyId}/close`, {})

  logger.debug('[Supplies API] Supply closed:', response.closedAt)

  return response
}

// =============================================================================
// Alias Exports (for hook compatibility)
// =============================================================================

/** Alias for getSupply - used by useSupplyDetail hook */
export const getSupplyDetail = getSupply

/** Alias for removeOrders - used by useRemoveOrders hook */
export const removeOrdersFromSupply = removeOrders
