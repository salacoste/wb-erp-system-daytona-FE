'use client'

/**
 * TrainModelButton — per-row training trigger for the AI Models table.
 * Story 109.4-FE.
 * 8 visual states per AC-4. WCAG 2.1 AA: aria-busy, aria-hidden, role="status".
 */

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTrainAiModel, parseTrainErrorMessage } from '@/hooks/useTrainAiModel'
import type { ModelType } from '@/types/ai/forecast'
import type { ModelStatus } from '@/types/ai/models'

interface TrainModelButtonProps {
  modelType: ModelType
  currentStatus: ModelStatus
}

type InlineState =
  { kind: 'idle' } | { kind: 'success'; text: string } | { kind: 'error'; text: string }

export function TrainModelButton({ modelType, currentStatus }: TrainModelButtonProps) {
  const { mutate, isPending } = useTrainAiModel()
  const [inline, setInline] = useState<InlineState>({ kind: 'idle' })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timer on unmount — prevents state updates after unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [])

  function scheduleReset(ms: number) {
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setInline({ kind: 'idle' }), ms)
  }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    mutate(modelType, {
      onSuccess: response => {
        const text = response.status === 'duplicate' ? 'Обучение уже идёт' : 'Запущено'
        setInline({ kind: 'success', text })
        scheduleReset(5_000)
      },
      onError: err => {
        const parsed = parseTrainErrorMessage(err)
        setInline({ kind: 'error', text: parsed.message })
        scheduleReset(8_000)
      },
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Prevent Space/Enter from bubbling to row keyboard handler.
    if (e.key === ' ' || e.key === 'Enter') {
      e.stopPropagation()
    }
  }

  // State: already training (disabled per locked Q4 decision — epic spec line 138)
  // aria-busy="true" signals ongoing async operation to screen readers (WCAG 2.1 AA, F-5 fix).
  if (currentStatus === 'training') {
    return (
      <Button size="sm" variant="outline" disabled aria-busy="true">
        <Loader2 className="animate-spin h-4 w-4 mr-1" aria-hidden="true" />
        Обучается
      </Button>
    )
  }

  // State: mutation in flight
  if (isPending) {
    return (
      <Button size="sm" variant="outline" disabled aria-busy={true}>
        <Loader2 className="animate-spin h-4 w-4 mr-1" aria-hidden="true" />
        Обучение запущено...
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="outline"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-busy={false}
      >
        Обучить
      </Button>
      {inline.kind !== 'idle' && (
        <span
          role="status"
          aria-live="polite"
          className={
            inline.kind === 'success'
              ? 'text-xs text-muted-foreground ml-2'
              : 'text-xs text-destructive ml-2'
          }
        >
          {inline.text}
        </span>
      )}
    </div>
  )
}
