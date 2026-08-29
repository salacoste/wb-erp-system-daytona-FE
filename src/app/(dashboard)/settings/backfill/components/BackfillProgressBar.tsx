/**
 * Backfill Progress Bar Component
 * Story 51.11-FE: Backfill Admin Page
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Animated progress bar with percentage display
 */

'use client'

import { cn, formatPercentage } from '@/lib/utils'
import type { BackfillStatus } from '@/types/backfill'

interface BackfillProgressBarProps {
  /** Progress percentage (0-100) */
  progress: number
  /** Current status for color coding */
  status: BackfillStatus
  /** Show percentage text */
  showText?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Animated progress bar for backfill status
 * - Gray for idle/pending
 * - Blue (animated) for in_progress
 * - Green for completed
 * - Red for failed
 * - Orange for paused
 */
export function BackfillProgressBar({
  progress,
  status,
  showText = true,
  className,
}: BackfillProgressBarProps) {
  const colorClass: Record<BackfillStatus, string> = {
    idle: 'bg-muted-foreground/50',
    not_started: 'bg-muted-foreground/40',
    pending: 'bg-status-warning',
    in_progress: 'bg-status-information',
    completed: 'bg-status-success',
    failed: 'bg-status-error',
    paused: 'bg-status-warning',
  }
  const clampedProgress = Math.min(100, Math.max(0, progress))
  const isAnimated = status === 'in_progress'

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative h-2 w-full min-w-[100px] overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out motion-reduce:transition-none',
            colorClass[status],
            isAnimated && 'animate-pulse motion-reduce:animate-none'
          )}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Прогресс: ${clampedProgress}%`}
        />
      </div>
      {showText && (
        <span
          className="min-w-[3rem] text-sm font-medium text-foreground tabular-nums"
          aria-hidden="true"
        >
          {/* visible % → ru-RU 1 decimal ("75,0 %", NBSP). 1 decimal (NOT Int) keeps a LIVE
              in-progress value honest: Int would round 99.7→"100 %" while the bar isn't full and
              status is still in_progress. aria-label keeps dot-locale (§4); CSS width uses raw. */}
          {formatPercentage(clampedProgress, 1)}
        </span>
      )}
    </div>
  )
}

export default BackfillProgressBar
