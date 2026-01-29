/**
 * OrderHistoryTimeline Component
 * Story 40.5-FE: History Timeline Components
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Full merged timeline view showing both local and WB native history entries.
 * Entries are sorted chronologically with source badges.
 *
 * @see docs/stories/epic-40/story-40.5-fe-history-timeline-components.md#AC1
 */

'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { FullHistoryEntry } from '@/types/orders-history'
import { TimelineEmptyState } from './TimelineEmptyState'
import { TimelineSummary } from './TimelineSummary'
import { HistoryEntryCard } from './HistoryEntryCard'
import {
  sortEntriesChronologically,
  calculateDurationBetween,
  countEntriesBySource,
  getTimeSpan,
} from './timeline-utils'

export interface OrderHistoryTimelineProps {
  /** Full history entries (WB + local merged) */
  entries: FullHistoryEntry[]
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
 * OrderHistoryTimeline - Full merged timeline with both sources interleaved
 */
export function OrderHistoryTimeline({
  entries,
  isLoading = false,
  compact = false,
  maxVisible = 10,
  className,
}: OrderHistoryTimelineProps) {
  if (isLoading) {
    return <TimelineSkeleton />
  }

  if (entries.length === 0) {
    return <TimelineEmptyState variant="full" />
  }

  const sorted = sortEntriesChronologically(entries)
  const { wbCount, localCount, total } = countEntriesBySource(sorted)
  const { first, last } = getTimeSpan(sorted)
  const hasScroll = sorted.length > maxVisible

  return (
    <div className={cn('space-y-3', className)}>
      {/* Summary Section */}
      <TimelineSummary
        variant="full"
        fullData={{
          totalCount: total,
          wbCount,
          localCount,
          firstTimestamp: first,
          lastTimestamp: last,
        }}
      />

      {/* Timeline List */}
      <ol
        role="list"
        aria-label="История статусов заказа"
        className={cn('relative ml-4', hasScroll && 'max-h-[500px] overflow-y-auto pr-2')}
      >
        {sorted.map((entry, index) => (
          <li key={`${entry.source}-${entry.timestamp}-${index}`}>
            <HistoryEntryCard
              entry={entry}
              durationToNext={calculateDurationBetween(sorted, index)}
              isLast={index === sorted.length - 1}
              compact={compact}
            />
          </li>
        ))}
      </ol>
    </div>
  )
}

function TimelineSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-12 w-full rounded-md" />
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-3 py-2">
          <Skeleton className="w-3 h-3 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  )
}
