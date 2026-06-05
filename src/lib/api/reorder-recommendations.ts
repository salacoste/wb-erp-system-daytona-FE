/**
 * Reorder Recommendations API Client
 * GET/PATCH/POST /v1/analytics/reorder-recommendations
 */

import { apiClient } from '../api-client'
import {
  normalizeReorderRecommendationsResponse,
  normalizeReorderMetricsResponse,
} from './reorder-recommendations-normalizer'
import type {
  ReorderRecommendation,
  ReorderFulfillmentMetrics,
  UpdateReorderStatusPayload,
} from '@/types/reorder-recommendations'

/** Query keys for reorder recommendations */
export const reorderQueryKeys = {
  all: ['reorder-recommendations'] as const,
  list: (params?: Record<string, string | number | undefined>) =>
    [...reorderQueryKeys.all, 'list', params] as const,
  metrics: () => [...reorderQueryKeys.all, 'metrics'] as const,
}

/** Fetch paginated reorder recommendations list */
export async function getReorderRecommendations(params?: {
  status?: string
  urgency?: string
  limit?: number
}): Promise<ReorderRecommendation[]> {
  const qs = new URLSearchParams()
  if (params?.status && params.status !== 'all') qs.set('status', params.status)
  if (params?.urgency) qs.set('urgency', params.urgency)
  if (params?.limit) qs.set('limit', String(params.limit))
  const query = qs.toString()
  const raw = await apiClient.get<unknown>(
    `/v1/analytics/reorder-recommendations${query ? `?${query}` : ''}`,
    { skipDataUnwrap: true }
  )
  return normalizeReorderRecommendationsResponse(raw)
}

/** Fetch fulfillment metrics summary */
export async function getReorderMetrics(): Promise<ReorderFulfillmentMetrics> {
  const raw = await apiClient.get<unknown>('/v1/analytics/reorder-recommendations/metrics', {
    skipDataUnwrap: true,
  })
  return normalizeReorderMetricsResponse(raw)
}

/** Trigger refresh/recompute of recommendations */
export async function refreshReorderRecommendations(): Promise<void> {
  return apiClient.post<void>('/v1/analytics/reorder-recommendations/refresh')
}

/** Update status of a single recommendation (ordered/received) */
export async function updateReorderStatus(
  id: string,
  payload: UpdateReorderStatusPayload
): Promise<ReorderRecommendation> {
  return apiClient.patch<ReorderRecommendation>(
    `/v1/analytics/reorder-recommendations/${id}`,
    payload
  )
}
