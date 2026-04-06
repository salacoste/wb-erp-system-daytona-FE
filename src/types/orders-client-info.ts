/**
 * Client Info (PII) types — Story 86.2
 * GET /v1/cabinets/:id/orders/client-info
 *
 * 🚨 PII data — must NOT be persisted to localStorage / sessionStorage / logs.
 */

/**
 * Single client info entry returned by the backend.
 * Backend DTO: ClientInfoItemDto (src/cabinets/dto/client-info-response.dto.ts)
 *
 * Note: backend returns `orderId` as a JSON number; the frontend keys its
 * lookup map by `String(orderId)` for compatibility with OrderFbsItem.orderId
 * (which is a string for BigInt safety).
 */
export interface ClientInfoItem {
  /** WB order ID (number from backend; converted to string for map lookup) */
  orderId: number
  /** Client display name (PII) — masked by WB e.g. "Иван И." */
  clientName?: string
  /** Client phone (PII) — masked by WB e.g. "+7999***1234" */
  clientPhone?: string
}

/**
 * Backend response shape: bare array (NOT wrapped in `{ data: [...] }`).
 * Use `apiClient.get(..., { skipDataUnwrap: true })` to receive this raw.
 */
export type ClientInfoResponse = ClientInfoItem[]

/**
 * Lookup map for O(1) row access — keys are stringified order IDs to match
 * OrderFbsItem.orderId (string).
 */
export type ClientInfoMap = Record<string, ClientInfoItem>
