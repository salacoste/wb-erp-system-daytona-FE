/**
 * DurationDisplay Component
 * Story 40.5-FE: History Timeline Components
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Human-readable duration display with Russian formatting.
 * Used to show time between timeline entries.
 *
 * @see docs/stories/epic-40/story-40.5-fe-history-timeline-components.md#AC6
 */

import { cn } from '@/lib/utils'
import { formatDuration, formatDurationCompact } from '@/lib/duration-utils'

export interface DurationDisplayProps {
  /** Duration in minutes (null shows em-dash) */
  minutes: number | null | undefined
  /** Show decorative separator dashes around duration */
  showSeparator?: boolean
  /** Show "в процессе" instead of duration value */
  isOngoing?: boolean
  /** Use compact formatting (shorter labels) */
  compact?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * DurationDisplay - Shows formatted duration between timeline events
 *
 * Formats duration according to Russian rules:
 * - < 1 min: "< 1 мин"
 * - Minutes: "{n} мин"
 * - Hours: "{h} ч {m} мин"
 * - Days: "{d} д {h} ч" or "{d} дней"
 */
export function DurationDisplay({
  minutes,
  showSeparator = false,
  isOngoing = false,
  compact = false,
  className,
}: DurationDisplayProps) {
  const formattedDuration = isOngoing
    ? 'в процессе'
    : compact
      ? formatDurationCompact(minutes)
      : formatDuration(minutes)

  if (showSeparator) {
    return (
      <span className={cn('inline-flex items-center text-xs text-muted-foreground', className)}>
        <span aria-hidden="true" className="select-none">
          ───{' '}
        </span>
        <span>{formattedDuration}</span>
        <span aria-hidden="true" className="select-none">
          {' '}
          ───
        </span>
      </span>
    )
  }

  return <span className={cn('text-xs text-muted-foreground', className)}>{formattedDuration}</span>
}
