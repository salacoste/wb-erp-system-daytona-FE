/**
 * Local History Tab Component
 * Story 40.4-FE: Order Details Modal
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Displays local status history with supplier_status and wb_status transitions.
 * Shows duration between transitions and summary.
 */

'use client'

import { Clock } from 'lucide-react'
import type { LocalHistoryResponse, LocalHistoryEntry } from '@/types/orders-history'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatHistoryTimestamp, formatDuration, TabErrorState, EmptyState } from './history-utils'

export interface LocalHistoryTabProps {
  data: LocalHistoryResponse | undefined
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/**
 * Local History Tab - local tracking with status transitions
 */
export function LocalHistoryTab({ data, isLoading, isError, refetch }: LocalHistoryTabProps) {
  if (isLoading) {
    return <TabLoadingSkeleton />
  }

  if (isError) {
    return <TabErrorState onRetry={refetch} />
  }

  if (!data || data.history.length === 0) {
    return <EmptyState message="История статусов пока пуста" />
  }

  const totalDuration = data.summary.totalDurationMinutes
    ? formatDuration(data.summary.totalDurationMinutes)
    : null

  return (
    <div className="space-y-3">
      <SummarySection summary={data.summary} totalDuration={totalDuration} />
      <CurrentStatusSection currentStatus={data.currentStatus} />
      <div className="space-y-1">
        {data.history.map((entry, index) => (
          <LocalHistoryTimelineEntry
            key={entry.id}
            entry={entry}
            isLast={index === data.history.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Sub-components
// ============================================================================

interface SummarySectionProps {
  summary: LocalHistoryResponse['summary']
  totalDuration: string | null
}

function SummarySection({ summary, totalDuration }: SummarySectionProps) {
  return (
    <div className="bg-muted/50 rounded-md p-3 text-sm">
      <span className="font-medium">Всего переходов: {summary.totalTransitions}</span>
      {totalDuration && (
        <>
          <span className="mx-2 text-muted-foreground">|</span>
          <span>Общее время: {totalDuration}</span>
        </>
      )}
      <div className="mt-1 text-xs text-muted-foreground">
        Создан: {formatHistoryTimestamp(summary.createdAt)}
        {summary.completedAt && (
          <span> | Завершён: {formatHistoryTimestamp(summary.completedAt)}</span>
        )}
      </div>
    </div>
  )
}

interface CurrentStatusSectionProps {
  currentStatus: LocalHistoryResponse['currentStatus']
}

function CurrentStatusSection({ currentStatus }: CurrentStatusSectionProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Текущий статус:</span>
      <StatusBadge label={currentStatus.supplierStatus} variant="supplier" />
      <StatusBadge label={currentStatus.wbStatus} variant="wb" />
      {currentStatus.isFinal && (
        <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Финал</span>
      )}
    </div>
  )
}

interface LocalHistoryTimelineEntryProps {
  entry: LocalHistoryEntry
  isLast: boolean
}

function LocalHistoryTimelineEntry({ entry, isLast }: LocalHistoryTimelineEntryProps) {
  const timestamp = formatHistoryTimestamp(entry.changedAt)
  const duration = entry.durationMinutes ? formatDuration(entry.durationMinutes) : null

  return (
    <div className="flex gap-3 py-2">
      <div className="flex flex-col items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
      </div>
      <div className="flex-1 min-w-0 pb-3">
        <span className="text-sm text-muted-foreground">{timestamp}</span>
        <div className="mt-1 text-sm space-y-1">
          <StatusTransition
            label="Статус продавца"
            from={entry.oldSupplierStatus}
            to={entry.newSupplierStatus}
            variant="supplier"
          />
          <StatusTransition
            label="WB статус"
            from={entry.oldWbStatus}
            to={entry.newWbStatus}
            variant="wb"
          />
        </div>
        {duration && !isLast && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>— {duration} —</span>
          </div>
        )}
      </div>
    </div>
  )
}

interface StatusTransitionProps {
  label: string
  from: string | null
  to: string
  variant: 'supplier' | 'wb'
}

function StatusTransition({ label, from, to, variant }: StatusTransitionProps) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-mono text-xs">{from ?? 'null'}</span>
      <span className="text-muted-foreground">→</span>
      <StatusBadge label={to} variant={variant} />
    </div>
  )
}

interface StatusBadgeProps {
  label: string
  variant: 'supplier' | 'wb'
}

function StatusBadge({ label, variant }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
        variant === 'supplier' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
      )}
    >
      {label}
    </span>
  )
}

function TabLoadingSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-16 w-full rounded-md" />
      <Skeleton className="h-8 w-48" />
      {[1, 2, 3].map(i => (
        <TimelineEntrySkeleton key={i} />
      ))}
    </div>
  )
}

function TimelineEntrySkeleton() {
  return (
    <div className="flex gap-3 py-2">
      <Skeleton className="w-3 h-3 rounded-full" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}
