/**
 * Unified Product Analytics API Client — Story 120.6-FE.
 *
 * Fetches GET /v1/analytics/product/:nmId/unified and normalizes via
 * Boundary Normalizer Pattern. Follows funnel-analytics.ts convention.
 *
 * Request #177 RESOLVED (2026-06-02): routes live, HTTP 200.
 * Backend caches for 30 min (CacheTTL.THIRTY_MINUTES).
 */

import { apiClient } from '@/lib/api-client'
import { normalizeUnifiedProductResponse } from '@/lib/api/unified-product-normalizer'
import type { UnifiedProductData } from '@/types/unified-product'

// ============================================================
// API function
// ============================================================

export interface UnifiedProductParams {
  nmId: string
  from: string
  to: string
}

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
// Query Keys Factory
// ============================================================

export const unifiedProductQueryKeys = {
  all: ['unified-product-analytics'] as const,
  data: (params: UnifiedProductParams) => [...unifiedProductQueryKeys.all, 'data', params] as const,
}

// ============================================================
// Cache Config
// ============================================================

/** staleTime < backend 30-min cache TTL. */
export const UNIFIED_PRODUCT_CACHE = {
  staleTime: 4 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
} as const
