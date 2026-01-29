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

import { Clock, User } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { LocalHistoryEntry } from '@/types/orders-history'
import { TimelineEmptyState } from './TimelineEmptyState'
import { TimelineSummary } from './TimelineSummary'
import { DurationDisplay } from './DurationDisplay'
import { formatHistoryTimestamp, sortEntriesChronologically } from './timeline-utils'

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

function LocalTimelineEntry({
  entry,
  isLast,
  compact,
}: {
  entry: LocalHistoryEntry
  isLast: boolean
  compact: boolean
}) {
  const timestamp = formatHistoryTimestamp(entry.changedAt)
  const isFinalStatus =
    entry.newSupplierStatus === 'complete' || entry.newSupplierStatus === 'cancel'

  return (
    <div className="flex gap-3 py-2">
      {/* Timeline dot and line */}
      <div className="flex flex-col items-center">
        <div
          className={cn('w-2.5 h-2.5 rounded-full', isFinalStatus ? 'bg-green-500' : 'bg-blue-500')}
        />
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <time dateTime={entry.changedAt} className="text-sm text-muted-foreground">
            {timestamp}
          </time>
          {isFinalStatus && (
            <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Финал</span>
          )}
        </div>

        {/* Status transitions */}
        <div className={cn('mt-1.5', compact ? 'text-xs' : 'text-sm', 'space-y-0.5')}>
          <StatusTransition
            label="Статус продавца"
            oldValue={entry.oldSupplierStatus}
            newValue={entry.newSupplierStatus}
          />
          <StatusTransition
            label="WB статус"
            oldValue={entry.oldWbStatus}
            newValue={entry.newWbStatus}
          />
        </div>

        {/* Changed by */}
        {entry.changedBy && (
          <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" aria-hidden="true" />
            <span>{entry.changedBy}</span>
          </div>
        )}

        {/* Duration */}
        {entry.durationMinutes !== null && !isLast && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <DurationDisplay minutes={entry.durationMinutes} showSeparator />
          </div>
        )}
      </div>
    </div>
  )
}

function StatusTransition({
  label,
  oldValue,
  newValue,
}: {
  label: string
  oldValue: string | null
  newValue: string | null
}) {
  // Don't show if both values are the same (no change)
  if (oldValue === newValue) {
    return null
  }

  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span>
        {oldValue ?? '—'} → {newValue ?? '—'}
      </span>
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
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  )
}
