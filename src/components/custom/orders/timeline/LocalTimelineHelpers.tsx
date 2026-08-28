'use client'

/**
 * LocalHistoryTimeline sub-components
 * Extracted from LocalHistoryTimeline.tsx for file size compliance
 * Story 40.5-FE: History Timeline Components
 */

import { Clock, User } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatDateTime } from '@/lib/utils'
import type { LocalHistoryEntry } from '@/types/orders-history'
import { DurationDisplay } from './DurationDisplay'

export function LocalTimelineEntry({
  entry,
  isLast,
  compact,
}: {
  entry: LocalHistoryEntry
  isLast: boolean
  compact: boolean
}) {
  const timestamp = formatDateTime(entry.changedAt)
  const isFinalStatus =
    entry.newSupplierStatus === 'complete' || entry.newSupplierStatus === 'cancel'

  return (
    <div className="flex gap-3 py-2">
      {/* Timeline dot and line */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'w-2.5 h-2.5 rounded-full',
            // Local-only view: dots encode STATUS (final vs in-flight),
            // not source — the pending/muted source split applies to the
            // mixed Full-history timeline only (172.14 pass-1 review).
            isFinalStatus ? 'bg-status-success' : 'bg-status-information'
          )}
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
            <span className="text-xs bg-status-success/10 text-status-success px-1.5 py-0.5 rounded">
              Финал
            </span>
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

export function StatusTransition({
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

export function TimelineSkeleton() {
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
