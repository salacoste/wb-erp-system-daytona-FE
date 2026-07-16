/**
 * Order Action Types — Epic Moysklad, Stories O2 / O3 / O4.
 * Mutation response + eligibility types for the per-row order actions
 * (confirm / cancel / marking-code meta).
 *
 * Co-located conceptually with src/lib/api/orders-actions.ts; placed in a
 * dedicated file because src/types/orders.ts is at the 200-line cap.
 */

import type { OrderOperationalStatus } from './orders'

/**
 * Operational statuses from which confirm (NEW → ASSEMBLED) is allowed.
 * Story O2: backend promotes NEW→ASSEMBLED best-effort on POST /confirm.
 */
export const CONFIRMABLE_STATUSES: readonly OrderOperationalStatus[] = ['NEW']

/**
 * Operational statuses from which cancel (→ CANCELLED) is allowed
 * (pre-shipment). Story O3: backend calls the WB SDK cancel → CANCELLED.
 */
export const CANCELLABLE_STATUSES: readonly OrderOperationalStatus[] = [
  'NEW',
  'ASSEMBLED',
  'PACKED',
]

/**
 * Response from POST /v1/orders/:orderUuid/confirm.
 * Story O2 — backend returns { confirmed: true } (no WB call).
 */
export interface ConfirmOrderResponse {
  confirmed: boolean
}

/**
 * Response from POST /v1/orders/:orderUuid/cancel.
 * Story O3 — backend WB SDK cancel → CANCELLED, returns { canceled: true }.
 */
export interface CancelOrderResponse {
  canceled: boolean
}

// ============================================================================
// Marking-code meta (Story O4)
// ============================================================================

/**
 * Operational statuses from which marking-code (meta) edit is allowed
 * (non-terminal). Story O4.
 */
export const META_EDITABLE_STATUSES: readonly OrderOperationalStatus[] = [
  'NEW',
  'ASSEMBLED',
  'PACKED',
  'SHIPPED',
]

/** Marking-code type (Честный ЗНАК) for WB FBS assembly orders. Story O4. */
export type OrderMetaType = 'IMEI' | 'GTIN' | 'SGTIN' | 'UIN'

/** All marking-code types (for Select rendering). Story O4. */
export const ORDER_META_TYPES: readonly OrderMetaType[] = ['IMEI', 'GTIN', 'SGTIN', 'UIN']

/** Labels for marking-code types (the codes are the universal labels). */
export const ORDER_META_TYPE_LABELS: Record<OrderMetaType, string> = {
  IMEI: 'IMEI',
  GTIN: 'GTIN',
  SGTIN: 'SGTIN',
  UIN: 'UIN',
}

/** Body for PATCH /v1/orders/:orderUuid/meta. Story O4. */
export interface UpdateOrderMetaBody {
  metaType: OrderMetaType
  /** Marking code, 1–200 chars (backend-validated). */
  value: string
}

/** Response from PATCH /v1/orders/:orderUuid/meta. Story O4. */
export interface UpdateOrderMetaResponse {
  updated: boolean
}

/** Body for PUT /v1/orders/:orderUuid/meta/expiration. */
export interface UpdateOrderExpirationBody {
  expirationDate: string
}

/** Returned only after the backend verifies the exact WB read-back. */
export interface UpdateOrderExpirationResponse {
  updated: true
  expirationDate: string
  decision: 'filled'
}

/** FEFO reservation plus the verified WB expiration write result. */
export interface AutoFillOrderExpirationResponse extends UpdateOrderExpirationResponse {
  reservationId: string
  batchId: string
}

export interface ReconcileOrderExpirationResponse {
  reconciled: true
  verified: boolean
  expirationDate: string | null
  decision: string | null
  outcome: 'verified' | 'mismatch' | 'invalid_readback'
}
