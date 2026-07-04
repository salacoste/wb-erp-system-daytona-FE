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
