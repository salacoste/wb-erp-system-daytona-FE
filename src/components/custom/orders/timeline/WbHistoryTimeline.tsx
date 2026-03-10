/**
 * WbHistoryTimeline Component
 * Story 40.5-FE: History Timeline Components
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * WB-only timeline with category grouping for 40+ status codes.
 *
 * @see docs/stories/epic-40/story-40.5-fe-history-timeline-components.md#AC2
 */

'use client'

import { cn } from '@/lib/utils'
import type { WbHistoryEntry } from '@/types/orders-history'
import { TimelineEmptyState } from './TimelineEmptyState'
import { TimelineSummary } from './TimelineSummary'
import { GroupedTimeline, FlatTimeline, TimelineSkeleton } from './WbTimelineEntry'

export interface WbHistoryTimelineProps {
  /** WB history entries */
  entries: WbHistoryEntry[]
  /** Summary data for header */
  summary?: {
    totalTransitions: number
    totalDurationMinutes: number | null
    currentWbStatus: string | null
  }
  /** Loading state */
  isLoading?: boolean
  /** Show entries grouped by category */
  groupByCategory?: boolean
  /** Compact display mode */
  compact?: boolean
  /** Maximum entries before scroll */
  maxVisible?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * WbHistoryTimeline - WB native status codes with optional category grouping
 */
export function WbHistoryTimeline({
  entries,
  summary,
  isLoading = false,
  groupByCategory = true,
  compact = false,
  maxVisible = 15,
  className,
}: WbHistoryTimelineProps) {
  if (isLoading) {
    return <TimelineSkeleton />
  }

  if (entries.length === 0) {
    return <TimelineEmptyState variant="wb" />
  }

  const hasScroll = entries.length > maxVisible

  return (
    <div className={cn('space-y-3', className)}>
      {/* Summary Section */}
      {summary && <TimelineSummary variant="wb" wbData={summary} />}

      {/* Timeline */}
      <div className={cn(hasScroll && 'max-h-[500px] overflow-y-auto pr-2')}>
        {groupByCategory ? (
          <GroupedTimeline entries={entries} compact={compact} />
        ) : (
          <FlatTimeline entries={entries} compact={compact} />
        )}
      </div>
    </div>
  )
}
