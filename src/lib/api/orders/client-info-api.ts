/**
 * Client Info (PII) API — Story 86.2
 * GET /v1/cabinets/:id/orders/client-info?orderIds=123,456
 *
 * NFR3 (non-negotiable): this module deliberately does NOT log request URLs or
 * response bodies. Do not add console.* statements here — a privacy guardrail
 * test in client-info-api.test.ts spies on console.{info,log,warn,error} and
 * asserts no calls during a successful invocation.
 */

import { apiClient } from '../../api-client'
import type { ClientInfoResponse } from '@/types/orders-client-info'

/** Backend cap — single-batch contract; chunking is the hook's responsibility. */
export const CLIENT_INFO_MAX_BATCH = 100

/**
 * Fetch client info for a batch of order IDs.
 *
 * @param cabinetId - Cabinet UUID for the request path
 * @param orderIds - Up to {@link CLIENT_INFO_MAX_BATCH} WB order IDs (strings for BigInt safety)
 * @throws Error when orderIds is empty or exceeds the max batch size
 * @returns Bare array of ClientInfoItem (matches backend DTO ClientInfoItemDto[])
 */
export async function getClientInfo(
  cabinetId: string,
  orderIds: string[]
): Promise<ClientInfoResponse> {
  if (!cabinetId) {
    throw new Error('cabinetId is required')
  }
  if (orderIds.length === 0) {
    throw new Error('orderIds must contain at least one value')
  }
  if (orderIds.length > CLIENT_INFO_MAX_BATCH) {
    throw new Error(`Maximum ${CLIENT_INFO_MAX_BATCH} orderIds per request`)
  }
  // Backend expects comma-separated query string parameter.
  // encodeURIComponent on cabinetId is defense-in-depth: cabinetIds are UUIDs and
  // do not require encoding, but a malformed value should not break URL parsing.
  const params = new URLSearchParams({ orderIds: orderIds.join(',') })
  // skipDataUnwrap because backend returns a bare array, not { data: [...] }
  return apiClient.get<ClientInfoResponse>(
    `/v1/cabinets/${encodeURIComponent(cabinetId)}/orders/client-info?${params}`,
    { skipDataUnwrap: true }
  )
}
