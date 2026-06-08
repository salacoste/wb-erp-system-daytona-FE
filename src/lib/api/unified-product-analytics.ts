/**
 * Unified Product Analytics API Client — Stories 120.6 + 120.7-FE.
 *
 * Fetches all 3 product analytics endpoints and normalizes via
 * Boundary Normalizer Pattern. Follows funnel-analytics.ts convention.
 *
 * Request #177 RESOLVED (2026-06-02): routes live, HTTP 200.
 * Backend caches for 30 min (CacheTTL.THIRTY_MINUTES).
 */

import { apiClient } from '@/lib/api-client'
import { normalizeUnifiedProductResponse } from '@/lib/api/unified-product-normalizer'
import {
  normalizeOrganicShareResponse,
  normalizeIncrementalRoasResponse,
} from '@/lib/api/unified-product-share-normalizer'
import type {
  UnifiedProductData,
  CorrelationDayItem,
  IncrementalRoasData,
} from '@/types/unified-product'

// ============================================================
// Shared params
// ============================================================

export interface UnifiedProductParams {
  nmId: string
  from: string
  to: string
}

// ============================================================
// GET /unified (Story 120.6)
// ============================================================

/** GET /v1/analytics/product/:nmId/unified */
export async function getUnifiedProductAnalytics(
  params: UnifiedProductParams
): Promise<UnifiedProductData> {
  const sp = new URLSearchParams()
  sp.set('from', params.from)
  sp.set('to', params.to)

  const raw = await apiClient.get<unknown>(
    `/v1/analytics/product/${params.nmId}/unified?${sp.toString()}`,
    { skipDataUnwrap: true }
  )

  return normalizeUnifiedProductResponse(raw)
}

// ============================================================
// GET /organic-share (Story 120.7)
// ============================================================

/** GET /v1/analytics/product/:nmId/organic-share → CorrelationResult[] */
export async function getOrganicShare(params: UnifiedProductParams): Promise<CorrelationDayItem[]> {
  const sp = new URLSearchParams()
  sp.set('from', params.from)
  sp.set('to', params.to)

  const raw = await apiClient.get<unknown>(
    `/v1/analytics/product/${params.nmId}/organic-share?${sp.toString()}`,
    { skipDataUnwrap: true }
  )

  return normalizeOrganicShareResponse(raw)
}

// ============================================================
// GET /incremental-roas (Story 120.7)
// ============================================================

/** GET /v1/analytics/product/:nmId/incremental-roas → IncrementalRoasResult */
export async function getIncrementalRoas(
  params: UnifiedProductParams
): Promise<IncrementalRoasData> {
  const sp = new URLSearchParams()
  sp.set('from', params.from)
  sp.set('to', params.to)

  const raw = await apiClient.get<unknown>(
    `/v1/analytics/product/${params.nmId}/incremental-roas?${sp.toString()}`,
    { skipDataUnwrap: true }
  )

  return normalizeIncrementalRoasResponse(raw)
}

// ============================================================
// Query Keys Factory
// ============================================================

export const unifiedProductQueryKeys = {
  all: ['unified-product-analytics'] as const,
  data: (params: UnifiedProductParams) => [...unifiedProductQueryKeys.all, 'data', params] as const,
  organicShare: (params: UnifiedProductParams) =>
    [...unifiedProductQueryKeys.all, 'organic-share', params] as const,
  incrementalRoas: (params: UnifiedProductParams) =>
    [...unifiedProductQueryKeys.all, 'incremental-roas', params] as const,
}

// ============================================================
// Cache Config
// ============================================================

/** staleTime < backend 30-min cache TTL. */
export const UNIFIED_PRODUCT_CACHE = {
  staleTime: 4 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
} as const
