/**
 * Backfill Control Buttons Component
 * Story 51.11-FE: Backfill Admin Page
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Action buttons for pause/resume/retry backfill operations
 */

'use client'

import { Pause, Play, RotateCcw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BackfillCabinetStatus } from '@/types/backfill'
import { canPause, canResume, canRetry } from '@/lib/backfill-utils'

interface BackfillControlButtonsProps {
  cabinet: BackfillCabinetStatus
  onPause: (cabinetId: string) => void
  onResume: (cabinetId: string) => void
  onRetry: (cabinetId: string) => void
  isPausing?: boolean
  isResuming?: boolean
  isRetrying?: boolean
}

/**
 * Control buttons for backfill actions.
 *
 * Story 165.5: the cabinet-wide `onRetry` action here is a FULL RESTART
 * (`useStartBackfill` → `/start`, NOT resume-from-checkpoint). It is labeled
 * "Перезапустить с нуля" so it cannot be read as the per-source retry path,
 * which lives in `BackfillRetryControls` (`/report/retry` | `/analytics/retry`).
 */
export function BackfillControlButtons({
  cabinet,
  onPause,
  onResume,
  onRetry,
  isPausing = false,
  isResuming = false,
  isRetrying = false,
}: BackfillControlButtonsProps) {
  const showPause = canPause(cabinet)
  const showResume = canResume(cabinet)
  const showRetry = canRetry(cabinet)
  const isLoading = isPausing || isResuming || isRetrying

  if (!showPause && !showResume && !showRetry) {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showPause && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPause(cabinet.cabinet_id)}
          disabled={isLoading}
          aria-label={`Приостановить бэкфилл для ${cabinet.cabinet_name}`}
          className="min-h-11 whitespace-normal"
        >
          {isPausing ? (
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
          ) : (
            <Pause className="mr-1 h-4 w-4" />
          )}
          Пауза
        </Button>
      )}

      {showResume && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onResume(cabinet.cabinet_id)}
          disabled={isLoading}
          aria-label={`Возобновить бэкфилл для ${cabinet.cabinet_name}`}
          className="min-h-11 whitespace-normal"
        >
          {isResuming ? (
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
          ) : (
            <Play className="mr-1 h-4 w-4" />
          )}
          Возобновить
        </Button>
      )}

      {showRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRetry(cabinet.cabinet_id)}
          disabled={isLoading}
          aria-label={`Перезапустить бэкфилл с нуля для ${cabinet.cabinet_name}`}
          className="min-h-11 whitespace-normal"
        >
          {isRetrying ? (
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
          ) : (
            <RotateCcw className="mr-1 h-4 w-4" />
          )}
          Перезапустить с нуля
        </Button>
      )}
    </div>
  )
}

export default BackfillControlButtons
