/**
 * Funnel Analytics API Client
 * Epic 68: Marketing Funnel (views -> cart -> orders -> buyouts -> cancels)
 * Reference: docs/request-backend/151-EPICS-68-71-ANALYTICS-API.md
 */

import { apiClient } from '@/lib/api-client'
import type { FunnelParams, FunnelResponse, FunnelSyncStatus } from '@/types/analytics-epics-68-71'

/**
 * Per-SKU funnel data or time series (groupBy=day)
 * GET /v1/analytics/funnel
 * Auth: X-Cabinet-Id header (auto via apiClient)
 */
export async function getFunnelData(params: FunnelParams): Promise<FunnelResponse> {
  const sp = new URLSearchParams()
  sp.set('from', params.from)
  sp.set('to', params.to)
  if (params.groupBy) sp.set('groupBy', params.groupBy)
  if (params.nmIds?.length) sp.set('nmIds', params.nmIds.join(','))
  if (params.sort) sp.set('sort', params.sort)
  if (params.order) sp.set('order', params.order)
  if (params.limit != null) sp.set('limit', String(params.limit))
  if (params.offset != null) sp.set('offset', String(params.offset))

  console.info('[Funnel] Fetching:', { from: params.from, to: params.to, groupBy: params.groupBy })

  const response = await apiClient.get<FunnelResponse>(`/v1/analytics/funnel?${sp.toString()}`, {
    skipDataUnwrap: true,
  })

  console.info('[Funnel] Response:', {
    items: response.items?.length ?? 0,
    total: response.pagination?.total ?? 0,
  })

  return response
}

/**
 * Funnel sync status — freshness indicator
 * GET /v1/analytics/funnel/sync-status
 */
export async function getFunnelSyncStatus(): Promise<FunnelSyncStatus> {
  console.info('[Funnel] Fetching sync status')
  return apiClient.get<FunnelSyncStatus>('/v1/analytics/funnel/sync-status', {
    skipDataUnwrap: true,
  })
}

// Query Keys Factory
export const funnelQueryKeys = {
  all: ['funnel-analytics'] as const,
  data: (params: FunnelParams) => [...funnelQueryKeys.all, 'data', params] as const,
  timeSeries: (from: string, to: string) =>
    [...funnelQueryKeys.all, 'timeseries', { from, to }] as const,
  syncStatus: () => [...funnelQueryKeys.all, 'sync-status'] as const,
}

// Cache: staleTime < backend TTL (5 min)
export const FUNNEL_CACHE = {
  staleTime: 4 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
} as const
