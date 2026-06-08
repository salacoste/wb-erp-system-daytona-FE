/**
 * Orders Integrity — API Client
 *
 * Wraps two backend endpoints with typed async functions and TanStack Query keys.
 *
 * Endpoints:
 *   GET /health/orders-integrity?cabinet_id={id}
 *     - NOT under /v1/ — uses apiClient with skipDataUnwrap since response is raw (no envelope)
 *   GET /v1/orders/reconciliation?cabinet_id={id}&from={YYYY-MM-DD}&to={YYYY-MM-DD}
 *     - Standard /v1/ endpoint with { data: {...} } envelope
 *
 * @see src/lib/api/orders-integrity-normalizer.ts
 * @see src/types/orders-integrity.ts
 */

import { apiClient } from '../api-client'
import { qs } from './query-string'
import type {
  OrdersIntegrityResponse,
  ReconciliationReport,
  ReconciliationParams,
} from '@/types/orders-integrity'
import {
  normalizeIntegrityResponse,
  normalizeReconciliationResponse,
} from './orders-integrity-normalizer'

// ---------------------------------------------------------------------------
// Query key factories
// ---------------------------------------------------------------------------

/** cabinetId first to prevent cross-cabinet cache collisions */
export const ordersIntegrityQueryKeys = {
  all: (cabinetId: string | null) => ['orders-integrity', cabinetId] as const,
}

export const ordersReconciliationQueryKeys = {
  all: (cabinetId: string | null) => ['orders-reconciliation', cabinetId] as const,
  list: (cabinetId: string | null, params: { from: string; to: string }) =>
    ['orders-reconciliation', cabinetId, 'list', params] as const,
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * GET /health/orders-integrity?cabinet_id={id}
 * Returns integrity health checks for orders data.
 *
 * NOTE: This endpoint is at /health/ NOT /v1/, and the response
 * is NOT wrapped in { data: ... }. We use skipDataUnwrap to get the raw object
 * and pass it through the normalizer.
 */
export async function getOrdersIntegrity(cabinetId: string): Promise<OrdersIntegrityResponse> {
  const raw = await apiClient.get<unknown>(
    `/health/orders-integrity${qs({ cabinet_id: cabinetId })}`,
    { skipDataUnwrap: true }
  )
  return normalizeIntegrityResponse(raw)
}

/**
 * GET /v1/orders/reconciliation?cabinet_id={id}&from={YYYY-MM-DD}&to={YYYY-MM-DD}
 * Returns orders reconciliation report for the given period.
 */
export async function getOrdersReconciliation(
  params: ReconciliationParams
): Promise<ReconciliationReport> {
  if (!params.from || !params.to) {
    throw new Error('getOrdersReconciliation: from and to are required')
  }
  const data = await apiClient.get<unknown>(
    `/v1/orders/reconciliation${qs({
      cabinet_id: params.cabinetId,
      from: params.from,
      to: params.to,
    })}`
  )
  return normalizeReconciliationResponse(data)
}
