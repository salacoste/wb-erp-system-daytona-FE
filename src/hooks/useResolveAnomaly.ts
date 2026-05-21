/**
 * useMutation hook for AI anomaly resolution (Owner or Manager role only).
 * PATCH /v1/ai/anomalies/:id/resolve
 * Story 112.3-FE: dual-role guard (Owner OR Manager) per AC-3/AC-7.
 *
 * On success: narrow-invalidates only ['ai', 'anomalies', cabinetId] per
 * Story 110.4-FE F-1 / Story 112.2-FE narrow-invalidation lesson /
 * ai-module-architecture.md § TanStack invalidation decision tree (Level 2).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { patchAnomalyResolve } from '@/lib/api/ai/system'
import { useAuthStore } from '@/stores/authStore'
import { ApiError } from '@/types/api'
import { anomaliesKeys } from './useAnomalies'
import type { ResolutionCause } from '@/types/ai/system'

export interface ResolveAnomalyInput {
  anomalyId: string
  resolutionCause: ResolutionCause
  resolutionNote?: string
}

export function useResolveAnomaly() {
  const cabinetId = useAuthStore(s => s.cabinetId)
  const user = useAuthStore(s => s.user)
  const queryClient = useQueryClient()

  return useMutation<void, ApiError | Error, ResolveAnomalyInput>({
    mutationFn: async ({ anomalyId, resolutionCause, resolutionNote }) => {
      // F-11: differentiate "auth not yet loaded" (user===null, store initial state)
      // from "explicitly denied". Throw generic Error to avoid surfacing a 403
      // "Доступ запрещён" message to a legitimate Owner/Manager on reload.
      if (user === null) {
        throw new Error('Auth not yet loaded')
      }
      // Defense-in-depth dual-role guard: prevents mutation if ineligible role
      // somehow reaches the dialog (e.g., stale auth state).
      if (user.role !== 'Owner' && user.role !== 'Manager') {
        throw new ApiError('Forbidden — Owner or Manager role required', 403)
      }
      return patchAnomalyResolve(anomalyId, { resolutionCause, resolutionNote })
    },
    onSuccess: () => {
      // Narrow invalidation: only anomaly list cache for this cabinet.
      // Do NOT use ['ai'] prefix — that scope-creeps into 9 sibling caches.
      queryClient.invalidateQueries({
        queryKey: anomaliesKeys.all(cabinetId),
      })
    },
  })
}
