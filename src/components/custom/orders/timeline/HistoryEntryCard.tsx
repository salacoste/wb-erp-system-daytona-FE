/**
 * HistoryEntryCard Component
 * Story 40.5-FE: History Timeline Components
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Single timeline entry card with status, timestamp, and source.
 *
 * @see docs/stories/epic-40/story-40.5-fe-history-timeline-components.md#AC4
 */

import { cn } from '@/lib/utils'
import type { FullHistoryEntry } from '@/types/orders-history'
import { getWbStatusConfig } from '@/lib/wb-status-mapping'
import { HistorySourceBadge } from './HistorySourceBadge'
import { DurationDisplay } from './DurationDisplay'
import { WbStatusBadge } from './WbStatusBadge'
import { formatHistoryTimestamp } from './timeline-utils'

export interface HistoryEntryCardProps {
  /** Full history entry (WB or local) */
  entry: FullHistoryEntry
  /** Duration to next entry in minutes */
  durationToNext?: number | null
  /** Is this the last entry in timeline */
  isLast?: boolean
  /** Compact display mode */
  compact?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * HistoryEntryCard - Renders a single timeline entry
 */
export function HistoryEntryCard({
  entry,
  durationToNext,
  isLast = false,
  compact = false,
  className,
}: HistoryEntryCardProps) {
  const isWb = entry.source === 'wb_native'
  const timestamp = formatHistoryTimestamp(entry.timestamp)

  return (
    <div className={cn('flex gap-3 py-2', className)}>
      {/* Timeline dot and line */}
      <div className="flex flex-col items-center">
        <TimelineDot isWb={isWb} statusCode={isWb ? entry.wbStatusCode : undefined} />
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
      </div>

      {/* Entry content */}
      <div className="flex-1 min-w-0 pb-3">
        {/* Header: timestamp + source badge */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <time dateTime={entry.timestamp} className="text-sm text-muted-foreground">
            {timestamp}
          </time>
          <HistorySourceBadge source={entry.source} />
        </div>

        {/* Status content based on source type */}
        {isWb ? <WbEntryContent entry={entry} compact={compact} /> : null}
        {!isWb ? <LocalEntryContent entry={entry} compact={compact} /> : null}

        {/* Duration to next entry */}
        {!isLast && durationToNext !== undefined && (
          <div className="mt-2">
            <DurationDisplay minutes={durationToNext} showSeparator compact={compact} />
          </div>
        )}
      </div>
    </div>
  )
}

interface TimelineDotProps {
  isWb: boolean
  statusCode?: string
}

function TimelineDot({ isWb, statusCode }: TimelineDotProps) {
  const bgColor = isWb && statusCode ? getWbStatusConfig(statusCode).bgColor : undefined

  return (
    <div
      className={cn(
        'w-2.5 h-2.5 rounded-full border-2',
        bgColor ?? (isWb ? 'bg-purple-500' : 'bg-blue-500')
      )}
    />
  )
}

interface WbEntryContentProps {
  entry: Extract<FullHistoryEntry, { source: 'wb_native' }>
  compact: boolean
}

function WbEntryContent({ entry, compact }: WbEntryContentProps) {
  return (
    <div className="mt-1.5">
      <WbStatusBadge statusCode={entry.wbStatusCode} size={compact ? 'sm' : 'md'} />
      {!compact && (
        <span className="text-xs text-muted-foreground ml-2">({entry.wbStatusCode})</span>
      )}
    </div>
  )
}

interface LocalEntryContentProps {
  entry: Extract<FullHistoryEntry, { source: 'local' }>
  compact: boolean
}

function LocalEntryContent({ entry, compact }: LocalEntryContentProps) {
  return (
    <div className={cn('mt-1.5', compact ? 'text-xs' : 'text-sm', 'space-y-0.5')}>
      <div>
        <span className="text-muted-foreground">Статус продавца: </span>
        <span>
          {entry.oldSupplierStatus ?? '—'} → {entry.newSupplierStatus}
        </span>
      </div>
      <div>
        <span className="text-muted-foreground">WB статус: </span>
        <span>
          {entry.oldWbStatus ?? '—'} → {entry.newWbStatus}
        </span>
      </div>
    </div>
  )
}
