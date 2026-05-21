/**
 * useMutation hook for updating AI Preferences (master aiEnabled toggle).
 * PATCH /v1/ai/preferences — Owner role only.
 * Story 112.2-FE Task 2.
 *
 * Two-layer Owner-role guard pattern (Story 112.1 F-3 + F-11 precedents):
 *   user===null  → generic Error (auth not yet hydrated, not explicitly denied)
 *   non-Owner    → ApiError(403) (explicitly denied)
 *
 * onSuccess: setQueryData with server response — NOT optimistic update (Story 112.2 Dev Notes).
 * Narrow invalidation: only own queryKey (Story 110.4-FE F-1 lesson — no ['ai'] prefix).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { patchAiPreferences } from '@/lib/api/ai/system'
import { useAuthStore } from '@/stores/authStore'
import { ApiError } from '@/types/api'
import { aiPreferencesKeys } from './useAiPreferences'
import type { AiPreferences } from '@/types/ai/system'

export function useUpdateAiPreferences() {
  const cabinetId = useAuthStore(s => s.cabinetId)
  const user = useAuthStore(s => s.user)
  const queryClient = useQueryClient()

  return useMutation<AiPreferences, ApiError | Error, Partial<AiPreferences>>({
    mutationFn: async body => {
      // F-11: differentiate "auth not yet loaded" from "explicitly denied".
      // user===null → auth store initial state (pre-hydration or logged-out);
      // throw generic Error (not ApiError) so form onError doesn't surface a
      // 403 "Нет доступа" message to a legitimate Owner on reload.
      if (user === null) {
        throw new Error('Auth not yet loaded')
      }
      // F-3: defense-in-depth Owner-role guard.
      if (user.role !== 'Owner') {
        throw new ApiError('Forbidden — Owner role required', 403)
      }
      // F-6: guard cabinetId null before mutating — prevents cache pollution at ['ai','preferences',null].
      if (!cabinetId) {
        throw new Error('Cabinet not selected')
      }
      return patchAiPreferences(body)
    },
    onSuccess: updatedPrefs => {
      // Cache update with server response (story 112.2 Dev Notes: use server truth, not optimistic).
      // Narrow invalidation: only own queryKey — ['ai'] prefix would scope-creep into
      // 9 sibling caches (Story 110.4-FE F-1 lesson).
      // F-6: cabinetId captured via closure — stable at onSuccess fire time because mutationFn
      // already validated it non-null before calling patchAiPreferences.
      queryClient.setQueryData(aiPreferencesKeys.byCabinet(cabinetId), updatedPrefs)
    },
  })
}
