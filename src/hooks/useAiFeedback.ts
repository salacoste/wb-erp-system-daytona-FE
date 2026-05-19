/**
 * useAiFeedback — mutation hook for POST /v1/ai/feedback.
 * Story 110.4-FE.
 *
 * On success with modelId: invalidates evaluations + sku-accuracy caches
 * so visible tables refresh without a manual page reload.
 * On success WITHOUT modelId (forecast page — no per-model identity):
 * defensively invalidates ['ai', 'forecast'] key (forecast hook only — avoids
 * cache-scope-creep from broader ['ai'] prefix match across 9 unrelated hooks).
 * Cabinet-isolated cache invalidation per Story 97.5-FE discipline.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postFeedback } from '@/lib/api/ai/system'
import { useAuthStore } from '@/stores/authStore'
import type { FeedbackType } from '@/types/ai/system'
import { ApiError } from '@/types/api'

export interface AiFeedbackInput {
  forecastId: string
  feedbackType: FeedbackType
  /** Optional — when provided, cache for this model is invalidated on success */
  modelId?: string
}

/**
 * Mutation hook: submits thumbs-up / thumbs-down feedback for a forecast.
 * Precedent: useTrainAiModel.ts (Story 109.4-FE).
 */
export function useAiFeedback() {
  const cabinetId = useAuthStore(s => s.cabinetId)
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, AiFeedbackInput>({
    // modelId is hook-local — NOT forwarded to backend (used only for onSuccess cache-invalidation scoping per AC-1).
    mutationFn: ({ forecastId, feedbackType }) => postFeedback({ forecastId, feedbackType }),
    onSuccess: (_data, variables) => {
      const { modelId } = variables
      if (!modelId) {
        // Fallback: no per-model identity (e.g., general forecast page) — invalidate forecast queries
        // so forecast list reflects the submitted feedback without requiring a manual reload (AC-6).
        // Narrowed to ['ai', 'forecast'] to avoid cache-scope-creep from broad ['ai'] prefix match
        // that would also invalidate 9 unrelated hooks (useAiHealth, useAiModels, etc.).
        queryClient.invalidateQueries({ queryKey: ['ai', 'forecast'] })
        return
      }
      // AC 2: invalidate evaluations + sku-accuracy for the submitted model.
      // Keys match aiEvaluationsKeys.byModel and aiSkuAccuracyKeys.byModel shapes.
      queryClient.invalidateQueries({
        queryKey: ['ai', 'evaluations', cabinetId, modelId],
      })
      queryClient.invalidateQueries({
        queryKey: ['ai', 'sku-accuracy', cabinetId, modelId],
      })
    },
  })
}
