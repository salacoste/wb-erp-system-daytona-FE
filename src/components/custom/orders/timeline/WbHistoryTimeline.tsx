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

import {
  Plus,
  Package,
  Warehouse,
  Truck,
  CheckCircle,
  XCircle,
  RotateCcw,
  HelpCircle,
  Clock,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { WbHistoryEntry } from '@/types/orders-history'
import type { WbStatusCategory } from '@/lib/wb-status-mapping'
import {
  getWbStatusConfig,
  isWbStatusFinal,
  WB_STATUS_CATEGORY_LABELS,
} from '@/lib/wb-status-mapping'
import { TimelineEmptyState } from './TimelineEmptyState'
import { TimelineSummary } from './TimelineSummary'
import { WbStatusBadge } from './WbStatusBadge'
import { DurationDisplay } from './DurationDisplay'
import { formatHistoryTimestamp, groupWbEntriesByCategory } from './timeline-utils'

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

const CATEGORY_ICONS: Record<WbStatusCategory, React.ComponentType<{ className?: string }>> = {
  creation: Plus,
  seller_processing: Package,
  warehouse: Warehouse,
  logistics: Truck,
  delivery: CheckCircle,
  cancellation: XCircle,
  return: RotateCcw,
  other: HelpCircle,
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

function GroupedTimeline({ entries, compact }: { entries: WbHistoryEntry[]; compact: boolean }) {
  const groups = groupWbEntriesByCategory(entries)

  return (
    <div className="space-y-4">
      {groups.map(group => (
        <CategorySection key={group.category} category={group.category} compact={compact}>
          {group.entries.map((entry, idx) => (
            <WbTimelineEntry
              key={entry.id}
              entry={entry}
              isLast={idx === group.entries.length - 1}
              compact={compact}
            />
          ))}
        </CategorySection>
      ))}
    </div>
  )
}

function CategorySection({
  category,
  compact,
  children,
}: {
  category: WbStatusCategory
  compact: boolean
  children: React.ReactNode
}) {
  const Icon = CATEGORY_ICONS[category]
  const label = WB_STATUS_CATEGORY_LABELS[category]

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 text-muted-foreground mb-2',
          compact ? 'text-xs' : 'text-sm'
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="font-medium">{label}</span>
      </div>
      <ol role="list" aria-label={label} className="ml-4 space-y-1">
        {children}
      </ol>
    </div>
  )
}

function FlatTimeline({ entries, compact }: { entries: WbHistoryEntry[]; compact: boolean }) {
  return (
    <ol role="list" aria-label="WB история статусов" className="ml-4 space-y-1">
      {entries.map((entry, idx) => (
        <WbTimelineEntry
          key={entry.id}
          entry={entry}
          isLast={idx === entries.length - 1}
          compact={compact}
        />
      ))}
    </ol>
  )
}

function WbTimelineEntry({
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
  const timestamp = formatHistoryTimestamp(entry.wbStatusChangedAt)
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
            <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Финал</span>
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

function TimelineSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-12 w-full rounded-md" />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex gap-3 py-2">
          <Skeleton className="w-3 h-3 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}
