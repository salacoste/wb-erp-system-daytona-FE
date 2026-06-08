/**
 * useOrdersIntegrity — TanStack Query hook for GET /health/orders-integrity
 *
 * Cache policy: 60s stale / 5min gc / retry 1 / refetchOnWindowFocus.
 * Rationale: health checks are near-realtime; 60s stale balances freshness
 * with API load.
 *
 * CLAUDE.md anti-pattern #2 compliance: explicit guard in queryFn.
 * CLAUDE.md anti-pattern #5 compliance: selector named `authState`.
 *
 * @see src/lib/api/orders-integrity-api.ts
 * @see src/types/orders-integrity.ts
 */

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { getOrdersIntegrity, ordersIntegrityQueryKeys } from '@/lib/api/orders-integrity-api'
import type { OrdersIntegrityResponse } from '@/types/orders-integrity'

export function useOrdersIntegrity(enabled = true) {
  const cabinetId = useAuthStore(authState => authState.cabinetId)

  return useQuery<OrdersIntegrityResponse>({
    queryKey: ordersIntegrityQueryKeys.all(cabinetId),
    queryFn: async () => {
      if (!cabinetId) throw new Error('useOrdersIntegrity: cabinetId is required')
      return getOrdersIntegrity(cabinetId)
    },
    enabled: enabled && cabinetId != null,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: true,
  })
}
