/**
 * Return Analytics API Client
 * Epic 71: Return reasons & per-SKU breakdown with anomaly detection
 * Reference: docs/request-backend/151-EPICS-68-71-ANALYTICS-API.md
 *
 * IMPORTANT: Returns endpoints use cabinetId as QUERY PARAM, not X-Cabinet-Id header.
 */

import { apiClient } from '@/lib/api-client'
import type {
  ReturnReasonsParams,
  ReturnReasonsResponse,
  ReturnsBySkuParams,
  BySkuReturnResponse,
} from '@/types/analytics-epics-68-71'

/**
 * Aggregated return reasons by category (for pie chart)
 * GET /v1/analytics/returns/reasons
 * Auth: cabinetId in query params (NOT header)
 */
export async function getReturnReasons(
  params: ReturnReasonsParams
): Promise<ReturnReasonsResponse> {
  const sp = new URLSearchParams()
  sp.set('cabinetId', params.cabinetId)
  if (params.from) sp.set('from', params.from)
  if (params.to) sp.set('to', params.to)
  if (params.locale) sp.set('locale', params.locale)

  console.info('[Returns] Fetching reasons:', {
    from: params.from,
    to: params.to,
    locale: params.locale ?? 'ru',
  })

  const response = await apiClient.get<ReturnReasonsResponse>(
    `/v1/analytics/returns/reasons?${sp.toString()}`,
    { skipDataUnwrap: true }
  )

  console.info('[Returns] Reasons response:', {
    totalReturns: response.summary?.totalReturns ?? 0,
    categories: response.byCategory?.length ?? 0,
  })

  return response
}

/**
 * Per-SKU return breakdown with anomaly flags (cursor pagination)
 * GET /v1/analytics/returns/reasons/by-sku
 * Auth: cabinetId in query params (NOT header)
 */
export async function getReturnsBySku(params: ReturnsBySkuParams): Promise<BySkuReturnResponse> {
  const sp = new URLSearchParams()
  sp.set('cabinetId', params.cabinetId)
  if (params.from) sp.set('from', params.from)
  if (params.to) sp.set('to', params.to)
  if (params.nmId != null) sp.set('nmId', String(params.nmId))
  if (params.anomalyOnly != null) sp.set('anomalyOnly', String(params.anomalyOnly))
  if (params.sortBy) sp.set('sortBy', params.sortBy)
  if (params.sortOrder) sp.set('sortOrder', params.sortOrder)
  if (params.limit != null) sp.set('limit', String(params.limit))
  if (params.cursor) sp.set('cursor', params.cursor)

  console.info('[Returns] Fetching by-sku:', {
    from: params.from,
    to: params.to,
    anomalyOnly: params.anomalyOnly ?? false,
  })

  const response = await apiClient.get<BySkuReturnResponse>(
    `/v1/analytics/returns/reasons/by-sku?${sp.toString()}`,
    { skipDataUnwrap: true }
  )

  console.info('[Returns] by-sku response:', {
    items: response.data?.length ?? 0,
    anomalies: response.summary?.anomalyCount ?? 0,
  })

  return response
}

// Query Keys Factory
export const returnQueryKeys = {
  all: ['return-analytics'] as const,
  reasons: (params: ReturnReasonsParams) => [...returnQueryKeys.all, 'reasons', params] as const,
  bySku: (params: ReturnsBySkuParams) => [...returnQueryKeys.all, 'by-sku', params] as const,
}

// Cache: staleTime < backend TTL (5 min)
export const RETURN_CACHE = {
  staleTime: 4 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
} as const
