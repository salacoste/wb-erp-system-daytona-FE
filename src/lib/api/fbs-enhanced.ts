/**
 * FBS Enhanced Analytics — API Client — Epic 96-FE Story 96.13-FE
 *
 * Wraps GET /v1/analytics/fbs/enhanced?from=&to= with a typed async function
 * and a TanStack Query key factory.
 *
 * Why skipDataUnwrap: true
 *   The default apiClient auto-unwraps `{ data: ... }` envelopes. The enhanced
 *   endpoint may return sections at the top level OR nested under `data`. We pass
 *   the raw envelope to the normalizer which handles both shapes.
 *   Pattern from src/lib/api/fbs-stock.ts.
 *
 * cabinetId in query key (Story 96.11 H2-1 lesson):
 *   Required as first segment to prevent cross-cabinet cache collisions.
 *   FBS analytics is per-cabinet data; stale cache would serve cabinet-A data
 *   to cabinet-B after a cabinet switch.
 *
 * @see src/lib/api/fbs-enhanced-normalizer.ts
 * @see src/types/fbs-enhanced.ts
 * @see docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md § 1.2
 */

import { apiClient } from '../api-client'
import { qs } from './query-string'
import type { FbsEnhancedResponse, FbsEnhancedParams } from '@/types/fbs-enhanced'
import { normalizeFbsEnhancedResponse } from './fbs-enhanced-normalizer'

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

/**
 * cabinetId is required as first segment to prevent cross-cabinet cache collisions
 * (CLAUDE.md 2nd-pass review H2-1 — multi-tenant data leak fix from Story 96.11).
 * FBS enhanced is a per-cabinet analytics snapshot; staleTime=30min would otherwise
 * serve cabinet-A data to cabinet-B after a cabinet switch.
 */
export const fbsEnhancedQueryKeys = {
  all: (cabinetId: string | null) => ['fbs-enhanced', cabinetId] as const,
  view: (cabinetId: string | null, params: FbsEnhancedParams) =>
    ['fbs-enhanced', cabinetId, 'view', params] as const,
}

// ---------------------------------------------------------------------------
// API function
// ---------------------------------------------------------------------------

/**
 * GET /v1/analytics/fbs/enhanced?from=&to=
 * Returns aggregated FBS analytics: orderStats, stockAnalytics, regionalData,
 * calculatedMetrics, funnelData for the given date range.
 */
export async function getFbsEnhanced(params: FbsEnhancedParams): Promise<FbsEnhancedResponse> {
  // Fail-fast: backend returns 400 for missing from/to.
  if (!params.from || !params.to) {
    throw new Error('getFbsEnhanced: from and to are required')
  }
  const raw = await apiClient.get<unknown>(
    `/v1/analytics/fbs/enhanced${qs({ from: params.from, to: params.to })}`,
    { skipDataUnwrap: true }
  )
  return normalizeFbsEnhancedResponse(raw)
}
