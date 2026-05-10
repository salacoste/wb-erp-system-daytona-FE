/**
 * FBS Stock Breakdowns — API Client — Epic 96-FE Story 96.11-FE
 *
 * Wraps the 3 backend FBS stock endpoints with typed async functions and
 * a TanStack Query key factory.
 *
 * Why skipDataUnwrap: true
 *   The default apiClient auto-unwraps `{ data: ... }` envelopes. FBS stock
 *   responses are `{ data: { groups/sizes/regions: [...] }, period, generatedAt }`.
 *   We need the full envelope (period + generatedAt for display), so we
 *   disable auto-unwrap and let the normalizer handle the full shape.
 *   Pattern from src/lib/api/acquiring-analytics.ts.
 *
 * Endpoints (per request-backend/169 § 1.2 — Epic 105 backend):
 *   GET /v1/analytics/fbs/stock/groups?from=&to=
 *   GET /v1/analytics/fbs/stock/sizes?from=&to=&nm_id= (nm_id optional)
 *   GET /v1/analytics/fbs/stock/regions (no params — latest-snapshot semantics)
 *
 * @see src/lib/api/fbs-stock-normalizer.ts
 * @see src/types/fbs-stock.ts
 * @see docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md § 1.2
 */

import { apiClient } from '../api-client'
import { qs } from './query-string'
import type {
  FbsStockGroupsResponse,
  FbsStockSizesResponse,
  FbsStockRegionsResponse,
  FbsStockGroupsParams,
  FbsStockSizesParams,
} from '@/types/fbs-stock'
import {
  normalizeFbsStockGroupsResponse,
  normalizeFbsStockSizesResponse,
  normalizeFbsStockRegionsResponse,
} from './fbs-stock-normalizer'

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

/**
 * cabinetId is required as first segment to prevent cross-cabinet cache collisions
 * (CLAUDE.md 2nd-pass review H2-1 — multi-tenant data leak fix).
 * FBS stock is a per-cabinet inventory snapshot; staleTime=30min would otherwise
 * serve cabinet-A data to cabinet-B after a cabinet switch.
 */
export const fbsStockQueryKeys = {
  all: (cabinetId: string | null) => ['fbs-stock', cabinetId] as const,
  groups: (cabinetId: string | null, params: FbsStockGroupsParams) =>
    ['fbs-stock', cabinetId, 'groups', params] as const,
  sizes: (cabinetId: string | null, params: FbsStockSizesParams) =>
    ['fbs-stock', cabinetId, 'sizes', params] as const,
  regions: (cabinetId: string | null) => ['fbs-stock', cabinetId, 'regions'] as const,
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * GET /v1/analytics/fbs/stock/groups?from=&to=
 * Returns product group breakdown of FBS stock for the given period.
 */
export async function getFbsStockGroups(
  params: FbsStockGroupsParams
): Promise<FbsStockGroupsResponse> {
  // Fail-fast: backend returns 400 for missing from/to.
  if (!params.from || !params.to) {
    throw new Error('getFbsStockGroups: from and to are required')
  }
  const raw = await apiClient.get<unknown>(
    `/v1/analytics/fbs/stock/groups${qs({ from: params.from, to: params.to })}`,
    { skipDataUnwrap: true }
  )
  return normalizeFbsStockGroupsResponse(raw)
}

/**
 * GET /v1/analytics/fbs/stock/sizes?from=&to=&nm_id= (nm_id optional)
 * Returns size breakdown of FBS stock for the given period, optionally filtered by article.
 */
export async function getFbsStockSizes(
  params: FbsStockSizesParams
): Promise<FbsStockSizesResponse> {
  // Fail-fast: backend returns 400 for missing from/to.
  if (!params.from || !params.to) {
    throw new Error('getFbsStockSizes: from and to are required')
  }
  const queryParts: Record<string, string | number | undefined> = {
    from: params.from,
    to: params.to,
  }
  if (params.nmId != null) queryParts.nm_id = params.nmId
  const raw = await apiClient.get<unknown>(`/v1/analytics/fbs/stock/sizes${qs(queryParts)}`, {
    skipDataUnwrap: true,
  })
  return normalizeFbsStockSizesResponse(raw)
}

/**
 * GET /v1/analytics/fbs/stock/regions
 * Returns warehouse region breakdown (latest snapshot — no date params).
 */
export async function getFbsStockRegions(): Promise<FbsStockRegionsResponse> {
  const raw = await apiClient.get<unknown>('/v1/analytics/fbs/stock/regions', {
    skipDataUnwrap: true,
  })
  return normalizeFbsStockRegionsResponse(raw)
}
