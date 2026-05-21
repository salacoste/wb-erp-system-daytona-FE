/**
 * useMutation hook for AI model rollback (Owner role only).
 * PATCH /v1/ai/admin/models/:id/rollback
 * Story 112.1-FE.
 *
 * On success: invalidates admin models list AND public models list
 * so both the admin page and any active model list views refresh.
 * Cabinet-isolated cache invalidation per Story 97.5-FE discipline.
 * Precedent: useAiFeedback (Story 110.4-FE) for mutation + invalidation pattern.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { patchModelRollback } from '@/lib/api/ai/admin'
import { useAuthStore } from '@/stores/authStore'
import { ApiError } from '@/types/api'

export interface ModelRollbackInput {
  modelId: string
  reason: string
}

export function useModelRollback() {
  const cabinetId = useAuthStore(s => s.cabinetId)
  const user = useAuthStore(s => s.user)
  const queryClient = useQueryClient()

  return useMutation<void, ApiError | Error, ModelRollbackInput>({
    mutationFn: async ({ modelId, reason }) => {
      // F-11: differentiate "auth not yet loaded" from "explicitly denied".
      // user===null → auth store initial state (pre-hydration or logged-out);
      // throw generic Error (not ApiError) so RollbackDialog onError doesn't
      // surface a 403 "Доступ запрещён" message to a legitimate Owner on reload.
      if (user === null) {
        throw new Error('Auth state not loaded — retry when hydration completes')
      }
      // F-3: defense-in-depth Owner-role guard — prevents mutation if non-Owner
      // somehow reaches RollbackDialog (e.g., stale auth state).
      if (user.role !== 'Owner') {
        throw new ApiError('Forbidden — Owner role required', 403)
      }
      return patchModelRollback(modelId, { reason })
    },
    onSuccess: () => {
      // F-2: Rollback affects ALL forecast outputs from this cabinet's models —
      // intentionally over-invalidate via prefix match. Detail pages, performance
      // trends, and evaluations may all reflect stale data until refetched.
      // This is correct: a rolled-back model produces new predictions across the board.
      queryClient.invalidateQueries({
        queryKey: ['ai', 'admin', 'models', cabinetId],
      })
      // Invalidate public models list — so any open model list view refreshes too.
      queryClient.invalidateQueries({
        queryKey: ['ai', 'models', cabinetId],
      })
    },
  })
}
