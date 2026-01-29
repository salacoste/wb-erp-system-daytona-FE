/**
 * Supplies API Client
 * Story 53.1-FE: TypeScript Types & API Client for Supplies
 * Epic 53-FE: Supply Management UI
 *
 * API functions for supplies list, details, orders, and document operations.
 */

import { apiClient } from '../api-client'
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
  GenerateStickersRequest,
  GenerateStickersResponse,
  SyncSuppliesResponse,
  StickerFormat,
  DocumentType,
} from '@/types/supplies'

// =============================================================================
// Query Keys Factory
// =============================================================================

/** Query keys for supplies (React Query caching) */
export const suppliesQueryKeys = {
  all: ['supplies'] as const,
  lists: () => [...suppliesQueryKeys.all, 'list'] as const,
  list: (params: SuppliesListParams) => [...suppliesQueryKeys.lists(), params] as const,
  details: () => [...suppliesQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...suppliesQueryKeys.details(), id] as const,
  documents: (id: string) => [...suppliesQueryKeys.all, 'documents', id] as const,
}

// =============================================================================
// Helper Functions
// =============================================================================

/** Build query string from params object, filtering out null/undefined */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  }

  return searchParams.toString()
}

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

  console.info('[Supplies API] Fetching supplies:', params)

  const response = await apiClient.get<SuppliesListResponse>(url, {
    skipDataUnwrap: true,
  })

  console.info('[Supplies API] Supplies response:', {
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
  console.info('[Supplies API] Fetching supply:', supplyId)

  return apiClient.get<SupplyDetailResponse>(`/v1/supplies/${supplyId}`, {
    skipDataUnwrap: true,
  })
}

// =============================================================================
// Create & Modify Operations
// =============================================================================

/**
 * Create new supply
 * POST /v1/supplies
 */
export async function createSupply(data: CreateSupplyRequest = {}): Promise<CreateSupplyResponse> {
  console.info('[Supplies API] Creating supply:', data)

  const response = await apiClient.post<CreateSupplyResponse>('/v1/supplies', data)

  console.info('[Supplies API] Supply created:', response.id)

  return response
}

/**
 * Add orders to supply (batch, max 1000)
 * POST /v1/supplies/:id/orders
 */
export async function addOrders(supplyId: string, orderIds: string[]): Promise<AddOrdersResponse> {
  console.info('[Supplies API] Adding orders:', {
    supplyId,
    orderCount: orderIds.length,
  })

  const response = await apiClient.post<AddOrdersResponse>(`/v1/supplies/${supplyId}/orders`, {
    orderIds,
  } as AddOrdersRequest)

  console.info('[Supplies API] Orders added:', {
    addedCount: response.addedCount,
    failures: response.failures?.length ?? 0,
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
  console.info('[Supplies API] Removing orders:', {
    supplyId,
    orderCount: orderIds.length,
  })

  // Use POST with body since DELETE with body isn't well supported
  const response = await apiClient.post<RemoveOrdersResponse>(
    `/v1/supplies/${supplyId}/orders/remove`,
    { orderIds } as RemoveOrdersRequest
  )

  console.info('[Supplies API] Orders removed:', response.removedCount)

  return response
}

/**
 * Close supply (transition OPEN -> CLOSED)
 * POST /v1/supplies/:id/close
 */
export async function closeSupply(supplyId: string): Promise<CloseSupplyResponse> {
  console.info('[Supplies API] Closing supply:', supplyId)

  const response = await apiClient.post<CloseSupplyResponse>(`/v1/supplies/${supplyId}/close`, {})

  console.info('[Supplies API] Supply closed:', response.closedAt)

  return response
}

// =============================================================================
// Document Operations
// =============================================================================

/**
 * Generate stickers for supply
 * POST /v1/supplies/:id/stickers
 */
export async function generateStickers(
  supplyId: string,
  format: StickerFormat = 'png'
): Promise<GenerateStickersResponse> {
  console.info('[Supplies API] Generating stickers:', { supplyId, format })

  const response = await apiClient.post<GenerateStickersResponse>(
    `/v1/supplies/${supplyId}/stickers`,
    { format } as GenerateStickersRequest
  )

  console.info('[Supplies API] Stickers generated:', response.document?.type)

  return response
}

/**
 * Download document (returns blob)
 * GET /v1/supplies/:id/documents/:type
 */
export async function downloadDocument(supplyId: string, docType: DocumentType): Promise<Blob> {
  console.info('[Supplies API] Downloading document:', { supplyId, docType })

  const response = await apiClient.get<Blob>(`/v1/supplies/${supplyId}/documents/${docType}`, {
    skipDataUnwrap: true,
  })

  console.info('[Supplies API] Document downloaded')

  return response
}

// =============================================================================
// Sync Operations
// =============================================================================

/**
 * Trigger manual sync with WB
 * POST /v1/supplies/sync
 * Rate limited: 1 request per 5 minutes
 */
export async function syncSupplies(): Promise<SyncSuppliesResponse> {
  console.info('[Supplies API] Syncing supplies with WB')

  const response = await apiClient.post<SyncSuppliesResponse>('/v1/supplies/sync', {})

  console.info('[Supplies API] Sync completed:', {
    syncedCount: response.syncedCount,
    statusChanges: response.statusChanges?.length ?? 0,
  })

  return response
}
