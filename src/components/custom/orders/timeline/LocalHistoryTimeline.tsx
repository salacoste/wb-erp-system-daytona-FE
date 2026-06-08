/**
 * LocalHistoryTimeline Component
 * Story 40.5-FE: History Timeline Components
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Local-only timeline showing supplier_status and wb_status transitions.
 *
 * @see docs/stories/epic-40/story-40.5-fe-history-timeline-components.md#AC3
 */

'use client'

import { cn } from '@/lib/utils'
import type { LocalHistoryEntry } from '@/types/orders-history'
import { TimelineEmptyState } from './TimelineEmptyState'
import { TimelineSummary } from './TimelineSummary'
import { sortEntriesChronologically } from './timeline-utils'
import { LocalTimelineEntry, TimelineSkeleton } from './LocalTimelineEntry'

export interface LocalHistoryTimelineProps {
  /** Local history entries */
  entries: LocalHistoryEntry[]
  /** Summary data for header */
  summary?: {
    totalTransitions: number
    createdAt: string
    completedAt: string | null
  }
  /** Loading state */
  isLoading?: boolean
  /** Compact display mode */
  compact?: boolean
  /** Maximum entries before scroll */
  maxVisible?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * LocalHistoryTimeline - Local status history with supplier and WB transitions
 */
export function LocalHistoryTimeline({
  entries,
  summary,
  isLoading = false,
  compact = false,
  maxVisible = 10,
  className,
}: LocalHistoryTimelineProps) {
  if (isLoading) {
    return <TimelineSkeleton />
  }

  if (entries.length === 0) {
    return <TimelineEmptyState variant="local" />
  }

  const sorted = sortEntriesChronologically(entries)
  const hasScroll = sorted.length > maxVisible

  return (
    <div className={cn('space-y-3', className)}>
      {/* Summary Section */}
      {summary && <TimelineSummary variant="local" localData={summary} />}

      {/* Timeline List */}
      <ol
        role="list"
        aria-label="Локальная история статусов"
        className={cn('relative ml-4', hasScroll && 'max-h-[500px] overflow-y-auto pr-2')}
      >
        {sorted.map((entry, index) => (
          <li key={entry.id}>
            <LocalTimelineEntry
              entry={entry}
              isLast={index === sorted.length - 1}
              compact={compact}
            />
          </li>
        ))}
      </ol>
    </div>
  )
}
