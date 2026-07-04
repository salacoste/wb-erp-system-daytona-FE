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
import type { ConfirmOrderResponse } from '@/types/orders-actions'

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
