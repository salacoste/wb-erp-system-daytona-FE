/**
 * Backfill Progress Bar Component
 * Story 51.11-FE: Backfill Admin Page
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Animated progress bar with percentage display
 */

'use client'

import { cn } from '@/lib/utils'
import type { BackfillStatus } from '@/types/backfill'
import { getProgressColorClass } from '@/lib/backfill-utils'

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
  const colorClass = getProgressColorClass(status)
  const isAnimated = status === 'in_progress'

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative h-2 w-full min-w-[100px] overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out',
            colorClass,
            isAnimated && 'animate-pulse'
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Прогресс: ${progress}%`}
        />
      </div>
      {showText && (
        <span className="min-w-[3rem] text-sm font-medium text-gray-700" aria-hidden="true">
          {progress}%
        </span>
      )}
    </div>
  )
}

export default BackfillProgressBar
