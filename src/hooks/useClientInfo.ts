/**
 * useClientInfo Hook — Story 86.2
 *
 * Fetches client name + phone for a list of FBS order IDs (Owner role only).
 *
 * Privacy guarantees (NFR3 — non-negotiable):
 * - gcTime: 0 — TanStack Query evicts data the moment all observers unmount.
 * - retry: false — failed requests do NOT auto-retry (avoids duplicate exposure).
 * - This module deliberately does NOT call console.* with response payloads.
 *   A test in useClientInfo.test.ts spies on info/log/warn/error to lock this in.
 * - Hook is enabled: false for non-Owner roles, so no network call is ever issued
 *   for Manager / Analyst / Service / unauthenticated users.
 */

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { getClientInfo, CLIENT_INFO_MAX_BATCH } from '@/lib/api/orders/client-info-api'
import type { ClientInfoMap, ClientInfoResponse } from '@/types/orders-client-info'

/** Stable query keys factory — sorts orderIds for deterministic cache keys */
export const clientInfoQueryKeys = {
  all: ['client-info'] as const,
  byOrderIds: (orderIds: string[]) => ['client-info', [...orderIds].sort().join(',')] as const,
}

/**
 * Split an array into chunks of at most {@link CLIENT_INFO_MAX_BATCH} items.
 * Pure function — exported for unit testing.
 */
export function chunkOrderIds(orderIds: string[]): string[][] {
  const chunks: string[][] = []
  for (let i = 0; i < orderIds.length; i += CLIENT_INFO_MAX_BATCH) {
    chunks.push(orderIds.slice(i, i + CLIENT_INFO_MAX_BATCH))
  }
  return chunks
}

/**
 * Convert the flat backend response array into an O(1) lookup map keyed by
 * stringified orderId (matches OrderFbsItem.orderId which is a string).
 * Pure function — exported for unit testing.
 */
export function buildClientInfoMap(responses: ClientInfoResponse[]): ClientInfoMap {
  const map: ClientInfoMap = {}
  for (const response of responses) {
    for (const item of response) {
      map[String(item.orderId)] = item
    }
  }
  return map
}

/**
 * useClientInfo — fetches and merges client info for a batch of order IDs.
 *
 * @param orderIds - Order IDs from the current orders table page (any size; auto-chunked)
 * @returns TanStack Query result whose `data` is a `ClientInfoMap` keyed by orderId string
 */
export function useClientInfo(orderIds: string[]) {
  const user = useAuthStore(state => state.user)
  const cabinetId = useAuthStore(state => state.cabinetId)
  const isOwner = user?.role === 'Owner'

  return useQuery<ClientInfoMap, Error>({
    queryKey: clientInfoQueryKeys.byOrderIds(orderIds),
    queryFn: async () => {
      // Runtime guard captures cabinetId as a non-null local — avoids `!` assertions
      // and protects against future refactors that might break the `enabled` invariant.
      if (!cabinetId) return {}
      const safeCabinetId = cabinetId
      const chunks = chunkOrderIds(orderIds)
      const responses = await Promise.all(chunks.map(chunk => getClientInfo(safeCabinetId, chunk)))
      return buildClientInfoMap(responses)
    },
    enabled: isOwner && cabinetId != null && orderIds.length > 0,
    // staleTime: 0 — gcTime: 0 means the cache is destroyed on unmount, so any
    // stale window > 0 is meaningless. Keep this aligned with gcTime for honesty.
    staleTime: 0,
    // NFR3: PII evicted immediately on unmount (no in-memory residue).
    gcTime: 0,
    // NFR3: never retry PII calls to avoid duplicate exposure.
    retry: false,
  })
}
