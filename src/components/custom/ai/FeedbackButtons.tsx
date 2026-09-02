'use client'

/**
 * FeedbackButtons — thumbs-up / thumbs-down feedback UI for forecast rows.
 * Story 110.4-FE.
 *
 * State machine: idle → pending (both disabled + Loader2 spinner) → success (Check + "Спасибо", 2s reset)
 *                                                                  → error (Alert role="alert", 5s reset)
 * WCAG 2.1 AA: aria-label (Russian), title, visible focus ring.
 * stopPropagation MANDATORY (nested inside clickable rows — Story 110.2-FE F-3 discipline).
 * F-5: declarative useEffect for isSuccess/isError prevents setState-on-unmount race.
 * F-6 (2nd-pass): instanceof ApiError guard before .status access — safe against non-ApiError runtime errors.
 * F-7: 403 renders "Нет доступа" (Defensive Frontend Principle).
 * F-8 (2nd-pass): Loader2 spinner during isPending for UX feedback on slow backends.
 * F-9: success uses role="status" aria-live="polite" for screen-reader announcement.
 * PB-4 (fixed 2026-09-02, debt D-3): success span previously used the legacy green-700
 * palette color — measured 5.02:1 light / 4.56:1 muted / 3.53:1 dark (AA fail, WCAG 1.4.3).
 * Now a solid pair (bg-status-success + its foreground token) per the 173.12 canon:
 * both themes >=4.5:1 by construction (5.13:1 light / 8.00:1 dark;
 * замер в артефакте debt-d3-d4-wcag-solid-pairs (ветка)).
 */
import { useState, useEffect } from 'react'
import { ThumbsUp, ThumbsDown, Check, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAiFeedback } from '@/hooks/useAiFeedback'
import { ApiError } from '@/types/api'

type VisibleState = 'idle' | 'success' | 'error'

interface FeedbackButtonsProps {
  forecastId: string
  modelId?: string
}

export function FeedbackButtons({ forecastId, modelId }: FeedbackButtonsProps) {
  const [visibleState, setVisibleState] = useState<VisibleState>('idle')
  const mutation = useAiFeedback()

  // F-5: declarative transition — safe on unmount (no setState in mutation callbacks).
  // F-4 (2nd-pass): include mutation.submittedAt so a second successful mutation (where isSuccess
  // stays true between calls) still fires the effect and shows 'Спасибо' again.
  useEffect(() => {
    if (mutation.isSuccess) setVisibleState('success')
    else if (mutation.isError) setVisibleState('error')
  }, [mutation.isSuccess, mutation.isError, mutation.submittedAt])

  // Auto-reset: success → idle after 2s; error → idle after 5s
  useEffect(() => {
    if (visibleState === 'idle') return
    const delay = visibleState === 'success' ? 2000 : 5000
    const timer = setTimeout(() => setVisibleState('idle'), delay)
    return () => clearTimeout(timer)
  }, [visibleState])

  function handleClick(feedbackType: 'thumbs_up' | 'thumbs_down') {
    return (e: React.MouseEvent) => {
      // stopPropagation FIRST — mandatory when button is inside a clickable row (Story 110.2-FE F-3)
      e.stopPropagation()
      mutation.mutate({ forecastId, feedbackType, modelId })
    }
  }

  if (visibleState === 'success') {
    return (
      // F-9: role="status" aria-live="polite" — screen readers announce "Спасибо" without interrupting.
      <span
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs bg-status-success text-status-success-foreground"
      >
        <Check className="h-4 w-4" aria-hidden="true" />
        Спасибо
      </span>
    )
  }

  if (visibleState === 'error') {
    // F-6 (2nd-pass): instanceof guard prevents silent undefined-access on non-ApiError runtime errors.
    // F-7: 403 → "Нет доступа" (Defensive Frontend Principle); other errors → generic message.
    const errorStatus = mutation.error instanceof ApiError ? mutation.error.status : undefined
    const errorMessage = errorStatus === 403 ? 'Нет доступа' : 'Не удалось сохранить отзыв'
    return (
      <span role="alert" className="inline-flex items-center gap-1 text-xs text-destructive">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        {errorMessage}
      </span>
    )
  }

  const disabled = mutation.isPending

  return (
    <span className="inline-flex items-center gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        aria-label="Полезный прогноз"
        title="Полезный прогноз"
        onClick={handleClick('thumbs_up')}
        className="h-7 w-7 p-0 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <ThumbsUp className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        aria-label="Бесполезный прогноз"
        title="Бесполезный прогноз"
        onClick={handleClick('thumbs_down')}
        className="h-7 w-7 p-0 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <ThumbsDown className="h-4 w-4" aria-hidden="true" />
      </Button>
      {/* F-8 (2nd-pass): inline spinner during in-flight mutation — UX feedback for backends >500ms */}
      {mutation.isPending && (
        <Loader2 className="animate-spin h-3 w-3 ml-1 text-muted-foreground" aria-hidden="true" />
      )}
    </span>
  )
}
