/**
 * useTrainAiModel — mutation hook for POST /v1/ai/models/train.
 * Story 109.4-FE.
 *
 * ApiError note: ApiError exposes `.data` (raw parsed JSON), NOT `.body`.
 * The 422 body is validated at runtime via `isInsufficientDataBody` type predicate
 * (F-3 fix: replaced `as InsufficientDataErrorBody` cast; CLAUDE.md anti-pattern #4).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postModelTrain } from '@/lib/api/ai/models'
import { formatPercentageInt } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { aiModelsKeys } from '@/hooks/useAiModels'
import type { ModelTrainResponse } from '@/types/ai/models'
import type { ModelType } from '@/types/ai/forecast'
import { ApiError } from '@/types/api'

// ── 422 structured body ──────────────────────────────────────────────────────

export interface InsufficientDataErrorBody {
  error: { code: 'INSUFFICIENT_DATA'; message: string }
  weeksCollected: number
  weeksRequired: number
  /** 0-100 scale, rendered as-is — no ×100 transformation (CLAUDE.md AP#8) */
  cogsCoveragePct: number
}

// ── isInsufficientDataBody — runtime type predicate (F-3 fix) ────────────────

function isInsufficientDataBody(v: unknown): v is InsufficientDataErrorBody {
  if (v == null || typeof v !== 'object') return false
  const obj = v as Record<string, unknown>
  // Validate numeric fields
  if (typeof obj.weeksCollected !== 'number') return false
  if (typeof obj.weeksRequired !== 'number') return false
  if (typeof obj.cogsCoveragePct !== 'number') return false
  // Validate nested `error: { code, message }` — post-2nd-pass F-1 fix.
  // Previously omitted, allowing malformed bodies to crash on `body.error.code`.
  if (obj.error == null || typeof obj.error !== 'object') return false
  const err = obj.error as Record<string, unknown>
  if (err.code !== 'INSUFFICIENT_DATA') return false
  if (typeof err.message !== 'string') return false
  return true
}

// ── parseTrainErrorMessage — pure helper, exported for direct unit testing ───

export type TrainErrorCode = 'INSUFFICIENT_DATA' | 'RATE_LIMIT' | 'PERMISSION' | 'UNKNOWN'

export interface TrainErrorResult {
  code: TrainErrorCode
  message: string
  details?: InsufficientDataErrorBody
}

/**
 * Maps an ApiError (or unknown value) to a canonical TrainErrorResult.
 * Pure function — no React, no side effects.
 */
export function parseTrainErrorMessage(error: unknown): TrainErrorResult {
  if (!(error instanceof ApiError)) {
    const msg = error instanceof Error ? error.message : 'Неизвестная ошибка'
    return { code: 'UNKNOWN', message: `Ошибка запуска обучения: ${msg}` }
  }

  if (error.status === 422) {
    if (isInsufficientDataBody(error.data)) {
      const body = error.data
      return {
        code: 'INSUFFICIENT_DATA',
        // formatPercentageInt already includes the "%" (Intl style:'percent') — do NOT append another
        message: `Недостаточно данных: собрано ${body.weeksCollected}/${body.weeksRequired} нед., покрытие COGS ${formatPercentageInt(body.cogsCoveragePct)}`,
        details: body,
      }
    }
    // Malformed 422 body — fall back to generic copy
    return {
      code: 'INSUFFICIENT_DATA',
      message: 'Недостаточно данных для обучения',
    }
  }

  if (error.status === 429) {
    return {
      code: 'RATE_LIMIT',
      message: 'Превышен лимит обучения, попробуйте через час',
    }
  }

  if (error.status === 401 || error.status === 403) {
    return {
      code: 'PERMISSION',
      message: 'Недостаточно прав для запуска обучения модели',
    }
  }

  return {
    code: 'UNKNOWN',
    message: `Ошибка запуска обучения: ${error.message}`,
  }
}

// ── useTrainAiModel mutation hook ────────────────────────────────────────────

/**
 * Mutation hook: triggers model training for the given modelType.
 * On success (201 queued OR 202 duplicate): invalidates aiModelsKeys.list(cabinetId).
 * Cabinet-isolated cache invalidation per Story 97.5-FE discipline.
 */
export function useTrainAiModel() {
  const cabinetId = useAuthStore(s => s.cabinetId)
  const queryClient = useQueryClient()

  return useMutation<ModelTrainResponse, ApiError, ModelType>({
    mutationFn: (modelType: ModelType) => postModelTrain({ modelType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiModelsKeys.list(cabinetId) })
    },
  })
}
