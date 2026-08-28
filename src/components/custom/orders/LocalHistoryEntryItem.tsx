/**
 * Local History Entry sub-components
 * Extracted from LocalHistoryTab.tsx for Story 74.8 (file size compliance)
 *
 * Contains: LocalHistoryTimelineEntry, StatusTransition, StatusBadge,
 * SummarySection, CurrentStatusSection, and loading skeletons.
 */

'use client'

import { Clock } from 'lucide-react'
import type { LocalHistoryResponse, LocalHistoryEntry } from '@/types/orders-history'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatDateTime } from '@/lib/utils'
import { formatDuration } from './history-utils'

// --- Summary & Current Status ---

interface SummarySectionProps {
  summary: LocalHistoryResponse['summary']
  totalDuration: string | null
}

export function SummarySection({ summary, totalDuration }: SummarySectionProps) {
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
        Создан: {formatDateTime(summary.createdAt)}
        {summary.completedAt && <span> | Завершён: {formatDateTime(summary.completedAt)}</span>}
      </div>
    </div>
  )
}

interface CurrentStatusSectionProps {
  currentStatus: LocalHistoryResponse['currentStatus']
}

export function CurrentStatusSection({ currentStatus }: CurrentStatusSectionProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Текущий статус:</span>
      <StatusBadge label={currentStatus.supplierStatus} variant="supplier" />
      <StatusBadge label={currentStatus.wbStatus} variant="wb" />
      {currentStatus.isFinal && (
        <span className="text-xs bg-status-success/10 text-status-success px-1.5 py-0.5 rounded">
          Финал
        </span>
      )}
    </div>
  )
}

// --- Timeline Entry ---

interface LocalHistoryTimelineEntryProps {
  entry: LocalHistoryEntry
  isLast: boolean
}

export function LocalHistoryTimelineEntry({ entry, isLast }: LocalHistoryTimelineEntryProps) {
  const timestamp = formatDateTime(entry.changedAt)
  const duration = entry.durationMinutes ? formatDuration(entry.durationMinutes) : null

  return (
    <div className="flex gap-3 py-2">
      <div className="flex flex-col items-center">
        {/* Local-only view: dot = in-flight status, not source (172.14). */}
        <div className="w-2.5 h-2.5 rounded-full bg-status-information" />
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

// --- Status helpers ---

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

export function StatusBadge({ label, variant }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
        // Story 172.14-FE (wave 2): wb (legacy purple) → pending, supplier (local system) → muted
        variant === 'supplier'
          ? 'bg-muted text-muted-foreground'
          : 'bg-status-pending/10 text-status-pending'
      )}
    >
      {label}
    </span>
  )
}

// --- Skeletons ---

export function TabLoadingSkeleton() {
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
