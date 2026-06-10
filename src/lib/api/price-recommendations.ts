/**
 * Price Recommendations API Client
 * Epic 121 Phase 1: Per-SKU price recommendation engine
 * Story 122.2-FE: history endpoint
 */

import { apiClient } from '../api-client'
import {
  normalizePriceRecommendationsResponse,
  normalizePriceRecommendation,
  normalizePriceRecommendationHistory,
} from './price-recommendations-normalizer'
import type {
  PriceRecommendation,
  PriceRecommendationsParams,
  PriceRecommendationsResponse,
  PriceRecommendationHistoryPoint,
  PriceRecommendationHistoryParams,
} from '@/types/price-recommendations'

const BASE = '/v1/products/price-recommendations'

/** Build query string from params, omitting empty values */
function buildQuery(params: PriceRecommendationsParams): string {
  const sp = new URLSearchParams()
  if (params.limit) sp.set('limit', String(params.limit))
  if (params.target_margin_pct !== undefined) {
    sp.set('target_margin_pct', String(params.target_margin_pct))
  }
  if (params.gap_filter) sp.set('gap_filter', params.gap_filter)
  if (params.sort) sp.set('sort', params.sort)
  if (params.cursor) sp.set('cursor', params.cursor)
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

/** GET /v1/products/price-recommendations — list with filters */
export async function getPriceRecommendations(
  params: PriceRecommendationsParams = {}
): Promise<PriceRecommendationsResponse> {
  const raw = await apiClient.get<unknown>(`${BASE}${buildQuery(params)}`, {
    skipDataUnwrap: true,
  })
  return normalizePriceRecommendationsResponse(raw)
}

/** GET /v1/products/price-recommendations/{nmId} — single SKU */
export async function getPriceRecommendation(nmId: number): Promise<PriceRecommendation> {
  const raw = await apiClient.get<unknown>(`${BASE}/${nmId}`, { skipDataUnwrap: true })
  return normalizePriceRecommendation(raw)
}

/** POST /v1/products/price-recommendations/refresh — trigger recomputation */
export async function refreshPriceRecommendations(): Promise<{ jobId: string }> {
  return apiClient.post<{ jobId: string }>(`${BASE}/refresh`)
}

/** GET /v1/products/price-recommendations/{nmId}/history — weekly price history (Story 122.2) */
export async function getPriceRecommendationHistory(
  nmId: number,
  params: PriceRecommendationHistoryParams = {}
): Promise<PriceRecommendationHistoryPoint[]> {
  const sp = new URLSearchParams()
  if (params.limit) sp.set('limit', String(params.limit))
  const qs = sp.toString()
  const raw = await apiClient.get<unknown>(`${BASE}/${nmId}/history${qs ? `?${qs}` : ''}`, {
    skipDataUnwrap: true,
  })
  return normalizePriceRecommendationHistory(raw)
}
