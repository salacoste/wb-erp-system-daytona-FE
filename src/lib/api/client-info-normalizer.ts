/**
 * Client Info — Boundary Normalizer
 *
 * Normalizes raw backend response from client-info endpoint.
 * PII data — no logging of request/response bodies.
 *
 * Endpoint: GET /v1/cabinets/:id/orders/client-info?orderIds=...
 *
 * @see CLAUDE.md § Boundary Normalizer Pattern
 */

import { asRecord, toCount, toOptionalString } from './normalizer-helpers'
import type { ClientInfoItem, ClientInfoResponse } from '@/types/orders-client-info'

/**
 * Normalizes a single ClientInfoItem from raw backend data.
 */
function normalizeClientInfoItem(raw: unknown): ClientInfoItem {
  const d = asRecord(raw)
  return {
    orderId: toCount(d.orderId ?? d.order_id),
    clientName: toOptionalString(d.clientName ?? d.client_name),
    clientPhone: toOptionalString(d.clientPhone ?? d.client_phone),
  }
}

/**
 * Normalizes the client-info response (bare array) into ClientInfoResponse.
 * Backend returns a bare array of ClientInfoItemDto — not wrapped in { data: [...] }.
 */
export function normalizeClientInfoResponse(raw: unknown): ClientInfoResponse {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeClientInfoItem)
}
