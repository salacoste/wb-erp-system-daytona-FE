/**
 * FBO Sales API Client
 *
 * API functions for FBO sales list and aggregation.
 * All responses pass through boundary normalizers.
 */

import { apiClient } from '../api-client'
import { logger } from '@/lib/logger'
import {
  normalizeSalesFboListResponse,
  normalizeSalesFboAggregateResponse,
} from './orders-fbo-normalizer'
import type { FboOrdersListParams } from '@/types/orders-fbo'
import type { SalesFboListResponse, SalesFboAggregateResponse } from '@/types/orders-fbo'

// --- Query string builder (shared with orders-fbo) ---

function buildQueryString(params: FboOrdersListParams): string {
  const sp = new URLSearchParams()
  const entries = Object.entries(params) as [string, unknown][]
  for (const [key, value] of entries) {
    if (value !== undefined && value !== null) {
      sp.append(key, String(value))
    }
  }
  return sp.toString()
}

// --- API Functions ---

/** GET /v1/sales/fbo — list FBO sales (paginated) */
export async function getSalesFbo(params: FboOrdersListParams = {}): Promise<SalesFboListResponse> {
  const qs = buildQueryString(params)
  const url = qs ? `/v1/sales/fbo?${qs}` : '/v1/sales/fbo'
  logger.debug('[FBO Sales] Fetching list:', params)

  const raw = await apiClient.get<unknown>(url, { skipDataUnwrap: true })
  return normalizeSalesFboListResponse(raw)
}

/** GET /v1/sales/fbo/aggregate — FBO sales aggregation */
export async function getSalesFboAggregate(
  params: FboOrdersListParams = {}
): Promise<SalesFboAggregateResponse> {
  const qs = buildQueryString(params)
  const url = qs ? `/v1/sales/fbo/aggregate?${qs}` : '/v1/sales/fbo/aggregate'
  logger.debug('[FBO Sales] Fetching aggregate:', params)

  const raw = await apiClient.get<unknown>(url, { skipDataUnwrap: true })
  return normalizeSalesFboAggregateResponse(raw)
}

// --- Query Keys Factory ---

export const salesFboQueryKeys = {
  all: ['sales-fbo'] as const,
  lists: () => [...salesFboQueryKeys.all, 'list'] as const,
  list: (params: FboOrdersListParams) => [...salesFboQueryKeys.lists(), params] as const,
  aggregate: (params: FboOrdersListParams) =>
    [...salesFboQueryKeys.all, 'aggregate', params] as const,
}
