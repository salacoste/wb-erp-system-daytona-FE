/**
 * Fulfillment (FBO/FBS) API Client
 * Epic 60: FBO/FBS Order Analytics Separation
 * @see docs/request-backend/130-DASHBOARD-FBO-ORDERS-API.md
 */

import { apiClient } from '../api-client'
import type {
  FulfillmentSummaryResponse,
  FulfillmentTrendsResponse,
  FulfillmentSyncStatusResponse,
  FulfillmentProductsResponse,
  StartFulfillmentSyncRequest,
  StartFulfillmentSyncResponse,
} from '@/types/fulfillment'

// =============================================================================
// Parameter Types
// =============================================================================

/** Parameters for GET /v1/analytics/fulfillment/summary */
export interface FulfillmentSummaryParams {
  from: string // YYYY-MM-DD
  to: string // YYYY-MM-DD (max 90 days)
}

/** Parameters for GET /v1/analytics/fulfillment/trends */
export interface FulfillmentTrendsParams {
  from: string // YYYY-MM-DD
  to: string // YYYY-MM-DD
  type?: 'fbo' | 'fbs' | 'all'
  metric?: 'orders' | 'sales' | 'revenue' | 'returns'
}

/** Parameters for GET /v1/analytics/fulfillment/products */
export interface FulfillmentProductsParams {
  from: string // YYYY-MM-DD
  to: string // YYYY-MM-DD
  type?: 'fbo' | 'fbs' | 'all'
  limit?: number // default: 50
  sort?: 'revenue' | 'orders' | 'returns'
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get FBO/FBS summary with metrics and shares
 * GET /v1/analytics/fulfillment/summary
 */
export async function getFulfillmentSummary(
  params: FulfillmentSummaryParams
): Promise<FulfillmentSummaryResponse> {
  const searchParams = new URLSearchParams({
    from: params.from,
    to: params.to,
  })

  console.info('[Fulfillment] Fetching summary:', params)

  return apiClient.get<FulfillmentSummaryResponse>(
    `/v1/analytics/fulfillment/summary?${searchParams.toString()}`,
    { skipDataUnwrap: true }
  )
}

/**
 * Get daily FBO/FBS breakdown (trends)
 * GET /v1/analytics/fulfillment/trends
 */
export async function getFulfillmentTrends(
  params: FulfillmentTrendsParams
): Promise<FulfillmentTrendsResponse> {
  const searchParams = new URLSearchParams({
    from: params.from,
    to: params.to,
  })

  if (params.type) {
    searchParams.set('type', params.type)
  }
  if (params.metric) {
    searchParams.set('metric', params.metric)
  }

  console.info('[Fulfillment] Fetching trends:', params)

  return apiClient.get<FulfillmentTrendsResponse>(
    `/v1/analytics/fulfillment/trends?${searchParams.toString()}`,
    { skipDataUnwrap: true }
  )
}

/**
 * Check if FBO/FBS data is available
 * GET /v1/analytics/fulfillment/sync-status
 */
export async function getFulfillmentSyncStatus(): Promise<FulfillmentSyncStatusResponse> {
  console.info('[Fulfillment] Checking sync status')

  return apiClient.get<FulfillmentSyncStatusResponse>('/v1/analytics/fulfillment/sync-status', {
    skipDataUnwrap: true,
  })
}

/**
 * Get product-level FBO/FBS breakdown
 * GET /v1/analytics/fulfillment/products
 */
export async function getFulfillmentProducts(
  params: FulfillmentProductsParams
): Promise<FulfillmentProductsResponse> {
  const searchParams = new URLSearchParams({
    from: params.from,
    to: params.to,
  })

  if (params.type) {
    searchParams.set('type', params.type)
  }
  if (params.limit !== undefined) {
    searchParams.set('limit', params.limit.toString())
  }
  if (params.sort) {
    searchParams.set('sort', params.sort)
  }

  console.info('[Fulfillment] Fetching products:', params)

  return apiClient.get<FulfillmentProductsResponse>(
    `/v1/analytics/fulfillment/products?${searchParams.toString()}`,
    { skipDataUnwrap: true }
  )
}

/**
 * Start FBO/FBS sync (admin only)
 * POST /v1/admin/fulfillment/sync
 */
export async function startFulfillmentSync(
  data: StartFulfillmentSyncRequest
): Promise<StartFulfillmentSyncResponse> {
  console.info('[Fulfillment] Starting sync:', data)

  return apiClient.post<StartFulfillmentSyncResponse>('/v1/admin/fulfillment/sync', data, {
    skipDataUnwrap: true,
  })
}

// =============================================================================
// Query Keys Factory
// =============================================================================

/** Query keys for React Query cache management */
export const fulfillmentQueryKeys = {
  all: ['fulfillment'] as const,

  summary: (from: string, to: string) =>
    [...fulfillmentQueryKeys.all, 'summary', from, to] as const,

  trends: (from: string, to: string, type?: string, metric?: string) =>
    [...fulfillmentQueryKeys.all, 'trends', from, to, type, metric] as const,

  syncStatus: ['fulfillment', 'sync-status'] as const,

  products: (from: string, to: string, type?: string, sort?: string) =>
    [...fulfillmentQueryKeys.all, 'products', from, to, type, sort] as const,
}
