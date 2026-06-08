/**
 * FBO Orders API Client
 *
 * API functions for FBO orders list, detail, aggregate, sync, and backfill.
 * All responses pass through boundary normalizers.
 */

import { apiClient } from '../api-client'
import { logger } from '@/lib/logger'
import {
  normalizeFboOrdersListResponse,
  normalizeFboOrderDetail,
  normalizeFboOrdersAggregateResponse,
  normalizeFboSyncStatusResponse,
  normalizeFboSyncTriggerResponse,
  normalizeFboBackfillResponse,
} from './orders-fbo-normalizer'
import type { FboOrdersListParams } from '@/types/orders-fbo'
import type {
  FboOrdersListResponse,
  OrderFboDetail,
  FboOrdersAggregateResponse,
  FboOrdersSyncStatusResponse,
  FboOrdersSyncTriggerResponse,
  FboOrdersBackfillParams,
  FboOrdersBackfillResponse,
} from '@/types/orders-fbo'

// --- Query string builder ---

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

/** GET /v1/orders/fbo — list FBO orders (paginated) */
export async function getFboOrders(
  params: FboOrdersListParams = {}
): Promise<FboOrdersListResponse> {
  const qs = buildQueryString(params)
  const url = qs ? `/v1/orders/fbo?${qs}` : '/v1/orders/fbo'
  logger.debug('[FBO Orders] Fetching list:', params)

  const raw = await apiClient.get<unknown>(url, { skipDataUnwrap: true })
  return normalizeFboOrdersListResponse(raw)
}

/** GET /v1/orders/fbo/:orderId — single FBO order detail */
export async function getFboOrderDetail(orderId: string): Promise<OrderFboDetail> {
  logger.debug('[FBO Orders] Fetching detail:', orderId)
  const raw = await apiClient.get<unknown>(`/v1/orders/fbo/${orderId}`)
  return normalizeFboOrderDetail(raw)
}

/** GET /v1/orders/fbo/aggregate — aggregated FBO order stats */
export async function getFboOrdersAggregate(
  params: FboOrdersListParams = {}
): Promise<FboOrdersAggregateResponse> {
  const qs = buildQueryString(params)
  const url = qs ? `/v1/orders/fbo/aggregate?${qs}` : '/v1/orders/fbo/aggregate'
  logger.debug('[FBO Orders] Fetching aggregate:', params)

  const raw = await apiClient.get<unknown>(url, { skipDataUnwrap: true })
  return normalizeFboOrdersAggregateResponse(raw)
}

/** POST /v1/orders/fbo/sync — manual sync trigger */
export async function triggerFboOrdersSync(): Promise<FboOrdersSyncTriggerResponse> {
  logger.debug('[FBO Orders] Triggering sync')
  const raw = await apiClient.post<unknown>('/v1/orders/fbo/sync', {}, { skipDataUnwrap: true })
  return normalizeFboSyncTriggerResponse(raw)
}

/** GET /v1/orders/fbo/sync-status — sync status */
export async function getFboOrdersSyncStatus(): Promise<FboOrdersSyncStatusResponse> {
  logger.debug('[FBO Orders] Fetching sync status')
  const raw = await apiClient.get<unknown>('/v1/orders/fbo/sync-status', { skipDataUnwrap: true })
  return normalizeFboSyncStatusResponse(raw)
}

/** POST /v1/orders/fbo/backfill — historical backfill */
export async function triggerFboOrdersBackfill(
  data: FboOrdersBackfillParams
): Promise<FboOrdersBackfillResponse> {
  logger.debug('[FBO Orders] Triggering backfill:', data)
  const raw = await apiClient.post<unknown>('/v1/orders/fbo/backfill', data, {
    skipDataUnwrap: true,
  })
  return normalizeFboBackfillResponse(raw)
}

// --- Query Keys Factory ---

export const ordersFboQueryKeys = {
  all: ['orders-fbo'] as const,
  lists: () => [...ordersFboQueryKeys.all, 'list'] as const,
  list: (params: FboOrdersListParams) => [...ordersFboQueryKeys.lists(), params] as const,
  details: () => [...ordersFboQueryKeys.all, 'detail'] as const,
  detail: (orderId: string) => [...ordersFboQueryKeys.details(), orderId] as const,
  aggregate: (params: FboOrdersListParams) =>
    [...ordersFboQueryKeys.all, 'aggregate', params] as const,
  syncStatus: () => [...ordersFboQueryKeys.all, 'sync-status'] as const,
}
