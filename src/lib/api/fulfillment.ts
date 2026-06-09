/**
 * Fulfillment (FBO/FBS) API Client
 * Epic 60: FBO/FBS Order Analytics Separation
 * @see docs/request-backend/130-DASHBOARD-FBO-ORDERS-API.md
 */

import { apiClient } from '../api-client'
import { logger } from '@/lib/logger'
import {
  normalizeFulfillmentSummaryResponse,
  normalizeFulfillmentTrendsResponse,
  normalizeFulfillmentSyncStatusResponse,
  normalizeFulfillmentProductsResponse,
} from './fulfillment-normalizer'
import type {
  FulfillmentSummaryResponse,
  FulfillmentTrendsResponse,
  FulfillmentSyncStatusResponse,
  FulfillmentProductsResponse,
  StartFulfillmentSyncRequest,
  StartFulfillmentSyncResponse,
} from '@/types/fulfillment'
import type {
  FulfillmentSummaryParams,
  FulfillmentTrendsParams,
  FulfillmentProductsParams,
} from './fulfillment-types'

export type {
  FulfillmentSummaryParams,
  FulfillmentTrendsParams,
  FulfillmentProductsParams,
} from './fulfillment-types'

export { fulfillmentQueryKeys } from './fulfillment-types'

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

  logger.debug('[Fulfillment] Fetching summary:', params)

  const raw = await apiClient.get<unknown>(
    `/v1/analytics/fulfillment/summary?${searchParams.toString()}`,
    { skipDataUnwrap: true }
  )
  return normalizeFulfillmentSummaryResponse(raw)
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

  logger.debug('[Fulfillment] Fetching trends:', params)

  const raw = await apiClient.get<unknown>(
    `/v1/analytics/fulfillment/trends?${searchParams.toString()}`,
    { skipDataUnwrap: true }
  )
  return normalizeFulfillmentTrendsResponse(raw)
}

/**
 * Check if FBO/FBS data is available
 * GET /v1/analytics/fulfillment/sync-status
 */
export async function getFulfillmentSyncStatus(): Promise<FulfillmentSyncStatusResponse> {
  logger.debug('[Fulfillment] Checking sync status')

  const raw = await apiClient.get<unknown>('/v1/analytics/fulfillment/sync-status', {
    skipDataUnwrap: true,
  })
  return normalizeFulfillmentSyncStatusResponse(raw)
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

  logger.debug('[Fulfillment] Fetching products:', params)

  const raw = await apiClient.get<unknown>(
    `/v1/analytics/fulfillment/products?${searchParams.toString()}`,
    { skipDataUnwrap: true }
  )
  return normalizeFulfillmentProductsResponse(raw)
}

/**
 * Start FBO/FBS sync (admin only)
 * POST /v1/admin/fulfillment/sync
 */
export async function startFulfillmentSync(
  data: StartFulfillmentSyncRequest
): Promise<StartFulfillmentSyncResponse> {
  logger.debug('[Fulfillment] Starting sync:', data)

  return apiClient.post<StartFulfillmentSyncResponse>('/v1/admin/fulfillment/sync', data, {
    skipDataUnwrap: true,
  })
}
