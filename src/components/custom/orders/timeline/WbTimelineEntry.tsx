/**
 * WB Timeline Entry component
 * Extracted from WbHistoryTimeline.tsx for Story 74.8 (file size compliance)
 *
 * @see docs/stories/epic-40/story-40.5-fe-history-timeline-components.md#AC2
 */

'use client'

import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WbHistoryEntry } from '@/types/orders-history'
import { getWbStatusConfig, isWbStatusFinal } from '@/lib/wb-status-mapping'
import { WbStatusBadge } from './WbStatusBadge'
import { DurationDisplay } from './DurationDisplay'
import { formatDateTime } from '@/lib/utils'

// Re-export views moved to TimelineViews.tsx for backward compatibility
export { GroupedTimeline, FlatTimeline, TimelineSkeleton } from './TimelineViews'

export function WbTimelineEntry({
  entry,
  isLast,
  compact,
}: {
  entry: WbHistoryEntry
  isLast: boolean
  compact: boolean
}) {
  const statusConfig = getWbStatusConfig(entry.wbStatusCode)
  const isFinal = isWbStatusFinal(entry.wbStatusCode)
  const timestamp = formatDateTime(entry.wbStatusChangedAt)
  const duration = entry.durationMinutes

  return (
    <li className="flex gap-3 py-2">
      {/* Timeline dot */}
      <div className="flex flex-col items-center">
        <div className={cn('w-2.5 h-2.5 rounded-full', statusConfig.bgColor)} />
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <time dateTime={entry.wbStatusChangedAt} className="text-sm text-muted-foreground">
            {timestamp}
          </time>
          {isFinal && (
            <span className="text-xs bg-status-success/10 text-status-success px-1.5 py-0.5 rounded">
              Финал
            </span>
          )}
        </div>

        <div className="mt-1.5">
          <WbStatusBadge statusCode={entry.wbStatusCode} size={compact ? 'sm' : 'md'} />
          {!compact && (
            <span className="text-xs text-muted-foreground ml-2">({entry.wbStatusCode})</span>
          )}
        </div>

        {/* Duration */}
        {duration !== null && !isLast && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <DurationDisplay minutes={duration} showSeparator />
          </div>
        )}
      </div>
    </li>
  )
}
