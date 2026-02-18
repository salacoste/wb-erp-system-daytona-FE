/**
 * Buyout Analytics API Client
 * Epic 69: Buyout Rate per-SKU analytics
 * Reference: docs/request-backend/151-EPICS-68-71-ANALYTICS-API.md
 */

import { apiClient } from '@/lib/api-client'
import type {
  BuyoutBySkuParams,
  BySkuBuyoutResponse,
  BuyoutSummaryParams,
  BuyoutSummaryResponse,
} from '@/types/analytics-epics-68-71'

/**
 * Per-SKU buyout rates with trend and confidence
 * GET /v1/analytics/buyout/by-sku
 * Auth: X-Cabinet-Id header (auto via apiClient)
 */
export async function getBuyoutBySku(params: BuyoutBySkuParams): Promise<BySkuBuyoutResponse> {
  const sp = new URLSearchParams()
  sp.set('from', params.from)
  sp.set('to', params.to)
  if (params.source) sp.set('source', params.source)
  if (params.trend != null) sp.set('trend', String(params.trend))
  if (params.nmId != null) sp.set('nmId', String(params.nmId))
  if (params.minSales != null) sp.set('minSales', String(params.minSales))
  if (params.sort) sp.set('sort', params.sort)
  if (params.sortOrder) sp.set('sortOrder', params.sortOrder)
  if (params.limit != null) sp.set('limit', String(params.limit))
  if (params.offset != null) sp.set('offset', String(params.offset))

  console.info('[Buyout] Fetching by-sku:', {
    from: params.from,
    to: params.to,
    source: params.source ?? 'blended',
  })

  const response = await apiClient.get<BySkuBuyoutResponse>(
    `/v1/analytics/buyout/by-sku?${sp.toString()}`,
    { skipDataUnwrap: true }
  )

  console.info('[Buyout] by-sku response:', {
    items: response.data?.length ?? 0,
    total: response.pagination?.total ?? 0,
  })

  return response
}

/**
 * Cabinet-level buyout summary with top decliners
 * GET /v1/analytics/buyout/summary
 */
export async function getBuyoutSummary(
  params: BuyoutSummaryParams
): Promise<BuyoutSummaryResponse> {
  const sp = new URLSearchParams()
  sp.set('from', params.from)
  sp.set('to', params.to)
  if (params.source) sp.set('source', params.source)

  console.info('[Buyout] Fetching summary:', { from: params.from, to: params.to })

  const response = await apiClient.get<BuyoutSummaryResponse>(
    `/v1/analytics/buyout/summary?${sp.toString()}`,
    { skipDataUnwrap: true }
  )

  console.info('[Buyout] Summary response:', {
    buyoutRate: response.overallBuyoutRatePct,
    skuCount: response.skuCount,
  })

  return response
}

// Query Keys Factory
export const buyoutQueryKeys = {
  all: ['buyout-analytics'] as const,
  bySku: (params: BuyoutBySkuParams) => [...buyoutQueryKeys.all, 'by-sku', params] as const,
  summary: (params: BuyoutSummaryParams) => [...buyoutQueryKeys.all, 'summary', params] as const,
}

// Cache: staleTime < backend TTL (30 min)
export const BUYOUT_CACHE = {
  staleTime: 25 * 60 * 1000,
  gcTime: 60 * 60 * 1000,
} as const
