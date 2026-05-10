'use client'

/**
 * useBuyoutReconciliation — Epic 96-FE Story 96.14-FE
 *
 * TanStack Query hook for GET /v1/analytics/buyout/reconciliation?from=&to=&nmId=
 * Returns per-SKU buyout/return reconciliation data with 3 anomaly count columns.
 *
 * Cache policy: 30 min stale / 60 min gc / retry 1 / NO refetchInterval.
 * Rationale: reconciliation data is a daily batch snapshot; user-triggered refresh sufficient.
 *
 * CLAUDE.md anti-pattern #2 compliance: explicit guard in queryFn, no cabinetId!.
 * CLAUDE.md anti-pattern #5 compliance: selector named `authState`.
 * Story 96.11 H2-1: cabinetId first in queryKey prevents cross-cabinet cache collisions.
 * Story 96.12 M2-2: queryKey includes cabinetId so cabinet switch invalidates cache.
 *
 * @see src/lib/api/buyout-reconciliation.ts
 * @see src/types/buyout-reconciliation.ts
 */

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import {
  getBuyoutReconciliation,
  buyoutReconciliationQueryKeys,
} from '@/lib/api/buyout-reconciliation'
import type { BuyoutReconciliationResponse } from '@/types/buyout-reconciliation'

export function useBuyoutReconciliation(from: string, to: string, nmId?: number, enabled = true) {
  const cabinetId = useAuthStore(authState => authState.cabinetId)

  return useQuery<BuyoutReconciliationResponse>({
    queryKey: buyoutReconciliationQueryKeys.list(cabinetId, { from, to, nmId }),
    queryFn: async () => {
      if (!cabinetId) throw new Error('useBuyoutReconciliation: cabinetId is required')
      return getBuyoutReconciliation({ from, to, nmId })
    },
    enabled: enabled && cabinetId != null && from !== '' && to !== '',
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    retry: 1,
  })
}
