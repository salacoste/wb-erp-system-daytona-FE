/**
 * Search Position Trends API Client
 * Backend: commit 3f29d8ca (2026-06-07)
 *
 * Four endpoints for search position trend analytics:
 *   GET /v1/analytics/search/position/trends       — week-over-week movers
 *   GET /v1/analytics/search/position-movers        — rolling period movers
 *   GET /v1/analytics/search/page-one-opportunities — SKUs close to page 1
 *   GET /v1/analytics/search/position-history/:nmId — per-SKU daily history
 */

import { apiClient } from '@/lib/api-client'
import type {
  PositionTrendsParams,
  PositionTrendsResponse,
  PositionMoversParams,
  PositionMoversResponse,
  PageOneOpportunitiesResponse,
  PositionHistoryParams,
  PositionHistoryResponse,
} from '@/types/search-position-trends'
import {
  normalizePositionTrendsResponse,
  normalizePositionMoversResponse,
  normalizePageOneOpportunitiesResponse,
  normalizePositionHistoryResponse,
} from './search-position-trends-normalizer'

// --- Query Keys ---

export const searchPositionKeys = {
  all: ['search-position-trends'] as const,
  trends: (params: PositionTrendsParams) => [...searchPositionKeys.all, 'trends', params] as const,
  movers: (params: PositionMoversParams) => [...searchPositionKeys.all, 'movers', params] as const,
  pageOneOpportunities: () => [...searchPositionKeys.all, 'page-one-opportunities'] as const,
  positionHistory: (nmId: number, params: PositionHistoryParams) =>
    [...searchPositionKeys.all, 'position-history', nmId, params] as const,
}

// Cache: same as search analytics (staleTime < backend TTL of 10 min)
export const SEARCH_POSITION_CACHE = {
  staleTime: 4 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
} as const

// --- API Functions ---

export async function getPositionTrends(
  params: PositionTrendsParams = {}
): Promise<PositionTrendsResponse> {
  const sp = new URLSearchParams()
  if (params.direction) sp.set('direction', params.direction)
  if (params.limit != null) sp.set('limit', String(params.limit))
  if (params.min_queries != null) sp.set('min_queries', String(params.min_queries))

  const raw = await apiClient.get<unknown>(
    `/v1/analytics/search/position/trends?${sp.toString()}`,
    { skipDataUnwrap: true }
  )
  return normalizePositionTrendsResponse(raw)
}

export async function getPositionMovers(
  params: PositionMoversParams = {}
): Promise<PositionMoversResponse> {
  const sp = new URLSearchParams()
  if (params.period) sp.set('period', params.period)

  const raw = await apiClient.get<unknown>(
    `/v1/analytics/search/position-movers?${sp.toString()}`,
    { skipDataUnwrap: true }
  )
  return normalizePositionMoversResponse(raw)
}

export async function getPageOneOpportunities(): Promise<PageOneOpportunitiesResponse> {
  const raw = await apiClient.get<unknown>('/v1/analytics/search/page-one-opportunities', {
    skipDataUnwrap: true,
  })
  return normalizePageOneOpportunitiesResponse(raw)
}

export async function getPositionHistory(
  nmId: number,
  params: PositionHistoryParams = {}
): Promise<PositionHistoryResponse> {
  const sp = new URLSearchParams()
  if (params.days != null) sp.set('days', String(params.days))

  const raw = await apiClient.get<unknown>(
    `/v1/analytics/search/position-history/${nmId}?${sp.toString()}`,
    { skipDataUnwrap: true }
  )
  return normalizePositionHistoryResponse(raw)
}
