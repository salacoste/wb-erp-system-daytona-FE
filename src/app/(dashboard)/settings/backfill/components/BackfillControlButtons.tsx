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
 * Control buttons for backfill actions
 * Shows appropriate button based on cabinet status
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
    return <span className="text-sm text-gray-400">—</span>
  }

  return (
    <div className="flex items-center gap-2">
      {showPause && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPause(cabinet.cabinet_id)}
          disabled={isLoading}
          aria-label={`Приостановить бэкфилл для ${cabinet.cabinet_name}`}
        >
          {isPausing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
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
        >
          {isResuming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
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
          aria-label={`Повторить бэкфилл для ${cabinet.cabinet_name}`}
        >
          {isRetrying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="mr-1 h-4 w-4" />
          )}
          Повторить
        </Button>
      )}
    </div>
  )
}

export default BackfillControlButtons
