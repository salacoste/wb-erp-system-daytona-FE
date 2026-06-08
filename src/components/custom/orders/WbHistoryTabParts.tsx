/**
 * Sub-components for WbHistoryTab — timeline entry, loading, error, empty states, duration helper
 * Story 40.4-FE: Order Details Modal
 */

'use client'

import { AlertCircle, RefreshCcw, Clock } from 'lucide-react'
import type { WbHistoryEntry } from '@/types/orders-history'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { getWbStatusConfig } from '@/lib/wb-status-mapping'
import { cn, formatDateTime } from '@/lib/utils'

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} мин`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours} ч ${remainingMinutes} мин` : `${hours} ч`
  }
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  return remainingHours > 0 ? `${days} д ${remainingHours} ч` : `${days} д`
}

interface WbHistoryTimelineEntryProps {
  entry: WbHistoryEntry
  isLast: boolean
}

export function WbHistoryTimelineEntry({ entry, isLast }: WbHistoryTimelineEntryProps) {
  const statusConfig = getWbStatusConfig(entry.wbStatusCode)
  const timestamp = formatDateTime(entry.wbStatusChangedAt)
  const duration = entry.durationMinutes ? formatDuration(entry.durationMinutes) : null

  return (
    <div className="flex gap-3 py-2">
      {/* Timeline dot and line */}
      <div className="flex flex-col items-center">
        <div
          className={cn('w-2.5 h-2.5 rounded-full', statusConfig.bgColor)}
          style={{ borderWidth: 2, borderColor: 'currentColor' }}
        />
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
      </div>

      {/* Entry content */}
      <div className="flex-1 min-w-0 pb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{timestamp}</span>
          {statusConfig.isFinal && (
            <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Финал</span>
          )}
        </div>

        <div className="mt-1">
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-sm font-medium',
              statusConfig.bgColor,
              statusConfig.color
            )}
          >
            {statusConfig.label}
          </span>
          <span className="text-xs text-muted-foreground ml-2">({entry.wbStatusCode})</span>
        </div>

        {/* Duration to next status */}
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

export function TabLoadingSkeleton() {
  return (
    <div className="space-y-3">
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

export function TabErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="ml-2 flex items-center gap-2">
        Не удалось загрузить данные.
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCcw className="h-4 w-4 mr-1" />
          Повторить
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>{message}</p>
    </div>
  )
}
