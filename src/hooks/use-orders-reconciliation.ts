/**
 * useOrdersReconciliation — TanStack Query hook for GET /v1/orders/reconciliation
 *
 * Cache policy: 60s stale / 5min gc / retry 1.
 * Enabled only when cabinetId, from, and to are all present.
 *
 * CLAUDE.md anti-pattern #2 compliance: explicit guard in queryFn.
 * CLAUDE.md anti-pattern #5 compliance: selector named `authState`.
 *
 * @see src/lib/api/orders-integrity-api.ts
 * @see src/types/orders-integrity.ts
 */

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import {
  getOrdersReconciliation,
  ordersReconciliationQueryKeys,
} from '@/lib/api/orders-integrity-api'
import type { ReconciliationReport } from '@/types/orders-integrity'

export function useOrdersReconciliation(from: string, to: string, enabled = true) {
  const cabinetId = useAuthStore(authState => authState.cabinetId)

  return useQuery<ReconciliationReport>({
    queryKey: ordersReconciliationQueryKeys.list(cabinetId, { from, to }),
    queryFn: async () => {
      if (!cabinetId) throw new Error('useOrdersReconciliation: cabinetId is required')
      return getOrdersReconciliation({ cabinetId, from, to })
    },
    enabled: enabled && cabinetId != null && from !== '' && to !== '',
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
  })
}
