/**
 * Buyout Reconciliation — API Client — Epic 96-FE Story 96.14-FE
 *
 * Wraps the reconciliation endpoint with a typed async function and
 * a TanStack Query key factory.
 *
 * Why skipDataUnwrap: true
 *   The default apiClient auto-unwraps `{ data: ... }` envelopes. The reconciliation
 *   response is `{ data: [...], period, generatedAt }`. We need the full envelope
 *   (period + generatedAt for display), so we disable auto-unwrap and let the
 *   normalizer handle the full shape. Pattern from src/lib/api/fbs-stock.ts.
 *
 * Endpoint (per request-backend/169 § 1.3 — Epic 106 backend):
 *   GET /v1/analytics/buyout/reconciliation?from=&to=&nmId= (nmId optional)
 *
 * @see src/lib/api/buyout-reconciliation-normalizer.ts
 * @see src/types/buyout-reconciliation.ts
 * @see docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md § 1.3
 */

import { apiClient } from '../api-client'
import { qs } from './query-string'
import type {
  BuyoutReconciliationResponse,
  BuyoutReconciliationParams,
} from '@/types/buyout-reconciliation'
import { normalizeBuyoutReconciliationResponse } from './buyout-reconciliation-normalizer'

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

/**
 * cabinetId is required as first segment to prevent cross-cabinet cache collisions
 * (CLAUDE.md 2nd-pass review H2-1 — multi-tenant data leak fix from Story 96.11).
 * Reconciliation data is per-cabinet; a cabinet switch must use fresh cache.
 */
export const buyoutReconciliationQueryKeys = {
  all: (cabinetId: string | null) => ['buyout-reconciliation', cabinetId] as const,
  list: (cabinetId: string | null, params: BuyoutReconciliationParams) =>
    ['buyout-reconciliation', cabinetId, 'list', params] as const,
}

// ---------------------------------------------------------------------------
// API function
// ---------------------------------------------------------------------------

/**
 * GET /v1/analytics/buyout/reconciliation?from=&to=&nmId=
 * Returns per-SKU buyout/return reconciliation data with anomaly counts for the period.
 *
 * PENDING BACKEND: request #169 § 1.3 — buyout reconciliation endpoint (Epic 106 backend).
 */
export async function getBuyoutReconciliation(
  params: BuyoutReconciliationParams
): Promise<BuyoutReconciliationResponse> {
  // Fail-fast: backend returns 400 for missing from/to.
  if (!params.from || !params.to) {
    throw new Error('getBuyoutReconciliation: from and to are required')
  }
  const queryParts: Record<string, string | number | undefined> = {
    from: params.from,
    to: params.to,
  }
  if (params.nmId != null) queryParts.nmId = params.nmId
  const raw = await apiClient.get<unknown>(`/v1/analytics/buyout/reconciliation${qs(queryParts)}`, {
    skipDataUnwrap: true,
  })
  return normalizeBuyoutReconciliationResponse(raw)
}
