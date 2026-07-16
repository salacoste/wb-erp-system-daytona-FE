/**
 * Orders Action API — confirm / cancel / marking-code meta mutations.
 * Epic Moysklad, Stories O2 / O3 / O4.
 *
 * Re-exported via the orders.ts barrel (same pattern as orders-history-api).
 * `orderUuid` is the OrderFbs UUID (order.id), NOT the WB orderId — AP#10:
 * opaque UUID passed through String().
 */
import { apiClient } from '../api-client'
import { logger } from '@/lib/logger'
import type {
  ConfirmOrderResponse,
  CancelOrderResponse,
  UpdateOrderMetaBody,
  UpdateOrderMetaResponse,
  UpdateOrderExpirationBody,
  UpdateOrderExpirationResponse,
  AutoFillOrderExpirationResponse,
  ReconcileOrderExpirationResponse,
} from '@/types/orders-actions'

/**
 * Confirm an order. Story O2.
 * POST /v1/orders/:orderUuid/confirm → { confirmed: true }.
 * No WB call; backend promotes NEW → ASSEMBLED best-effort. Precondition:
 * operationalStatus === NEW (see CONFIRMABLE_STATUSES); backend rejects
 * non-confirmable orders — surfaced to the user by the mutation hook.
 */
export async function confirmOrder(orderUuid: string): Promise<ConfirmOrderResponse> {
  const url = `/v1/orders/${String(orderUuid)}/confirm`
  logger.debug('[Orders API] Confirm order:', orderUuid)
  return apiClient.post<ConfirmOrderResponse>(url)
}

/**
 * Cancel an order. Story O3.
 * POST /v1/orders/:orderUuid/cancel → { canceled: true }.
 * Backend calls the WB SDK cancel → CANCELLED. Precondition: pre-shipment
 * status (see CANCELLABLE_STATUSES); backend rejects already-shipped orders.
 */
export async function cancelOrder(orderUuid: string): Promise<CancelOrderResponse> {
  const url = `/v1/orders/${String(orderUuid)}/cancel`
  logger.debug('[Orders API] Cancel order:', orderUuid)
  return apiClient.post<CancelOrderResponse>(url)
}

/**
 * Update an order's marking-code meta. Story O4.
 * PATCH /v1/orders/:orderUuid/meta { metaType, value } → { updated: true }.
 * Maps to WB SDK ordersFBS.updateMeta* (Честный ЗНАК). `value` is 1–200 chars
 * (backend-validated; the FE dialog mirrors the same constraint).
 */
export async function updateOrderMeta(
  orderUuid: string,
  body: UpdateOrderMetaBody
): Promise<UpdateOrderMetaResponse> {
  const url = `/v1/orders/${String(orderUuid)}/meta`
  logger.debug('[Orders API] Update order meta:', { orderUuid, metaType: body.metaType })
  return apiClient.patch<UpdateOrderMetaResponse>(url, body)
}

/** Update WB expiration metadata and return only after verified read-back. */
export async function updateOrderExpiration(
  orderUuid: string,
  body: UpdateOrderExpirationBody
): Promise<UpdateOrderExpirationResponse> {
  const url = `/v1/orders/${String(orderUuid)}/meta/expiration`
  logger.debug('[Orders API] Update order expiration:', { orderUuid })
  return apiClient.put<UpdateOrderExpirationResponse>(url, body)
}

/** Reserve the next FEFO batch and write its date through the verified WB flow. */
export async function autoFillOrderExpiration(
  orderUuid: string
): Promise<AutoFillOrderExpirationResponse> {
  const url = `/v1/orders/${String(orderUuid)}/meta/expiration/from-stock-batch`
  logger.debug('[Orders API] Auto-fill expiration from FEFO batch:', { orderUuid })
  return apiClient.put<AutoFillOrderExpirationResponse>(url)
}

/** Safe read-only WB read-back for the latest correlated expiration attempt. */
export async function reconcileOrderExpiration(
  orderUuid: string
): Promise<ReconcileOrderExpirationResponse> {
  const url = `/v1/orders/${String(orderUuid)}/meta/expiration/reconcile`
  logger.debug('[Orders API] Reconcile order expiration:', { orderUuid })
  return apiClient.post<ReconcileOrderExpirationResponse>(url)
}
