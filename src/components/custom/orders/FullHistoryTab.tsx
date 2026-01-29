/**
 * Full History Tab Component
 * Story 40.4-FE: Order Details Modal
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Displays merged timeline from both local and WB sources.
 * Shows source badge for each entry and summary statistics.
 */

'use client'

import { AlertCircle, RefreshCcw } from 'lucide-react'
import type { FullHistoryResponse, FullHistoryEntry } from '@/types/orders-history'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getWbStatusLabel, getWbStatusConfig } from '@/lib/wb-status-mapping'
import { cn } from '@/lib/utils'

export interface FullHistoryTabProps {
  data: FullHistoryResponse | undefined
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/**
 * Full History Tab - merged timeline with source badges
 */
export function FullHistoryTab({ data, isLoading, isError, refetch }: FullHistoryTabProps) {
  if (isLoading) {
    return <TabLoadingSkeleton />
  }

  if (isError) {
    return <TabErrorState onRetry={refetch} />
  }

  if (!data || data.fullHistory.length === 0) {
    return <EmptyState message="История статусов пока пуста" />
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="bg-muted/50 rounded-md p-3 text-sm">
        <span className="font-medium">Итого: {data.summary.totalEntriesCount} записей</span>
        <span className="mx-2 text-muted-foreground">|</span>
        <span>WB: {data.summary.wbNativeEntriesCount}</span>
        <span className="mx-2 text-muted-foreground">|</span>
        <span>Локальная: {data.summary.localEntriesCount}</span>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        {data.fullHistory.map((entry, index) => (
          <FullHistoryTimelineEntry
            key={`${entry.timestamp}-${index}`}
            entry={entry}
            isLast={index === data.fullHistory.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

interface FullHistoryTimelineEntryProps {
  entry: FullHistoryEntry
  isLast: boolean
}

function FullHistoryTimelineEntry({ entry, isLast }: FullHistoryTimelineEntryProps) {
  const isWb = entry.source === 'wb_native'
  const timestamp = formatHistoryTimestamp(entry.timestamp)

  return (
    <div className="flex gap-3 py-2">
      {/* Timeline dot and line */}
      <div className="flex flex-col items-center">
        <div className={cn('w-2.5 h-2.5 rounded-full', isWb ? 'bg-purple-500' : 'bg-blue-500')} />
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
      </div>

      {/* Entry content */}
      <div className="flex-1 min-w-0 pb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{timestamp}</span>
          <Badge variant={isWb ? 'secondary' : 'outline'} className="text-xs">
            {isWb ? 'WB' : 'Локальная'}
          </Badge>
        </div>

        {isWb && entry.source === 'wb_native' && <WbEntryContent entry={entry} />}

        {!isWb && entry.source === 'local' && <LocalEntryContent entry={entry} />}
      </div>
    </div>
  )
}

function WbEntryContent({ entry }: { entry: Extract<FullHistoryEntry, { source: 'wb_native' }> }) {
  const statusConfig = getWbStatusConfig(entry.wbStatusCode)

  return (
    <div className="mt-1">
      <span className={cn('text-sm font-medium', statusConfig.color)}>
        {getWbStatusLabel(entry.wbStatusCode)}
      </span>
      <span className="text-xs text-muted-foreground ml-2">({entry.wbStatusCode})</span>
    </div>
  )
}

function LocalEntryContent({ entry }: { entry: Extract<FullHistoryEntry, { source: 'local' }> }) {
  return (
    <div className="mt-1 text-sm space-y-0.5">
      <div>
        <span className="text-muted-foreground">Статус продавца: </span>
        <span>
          {entry.oldSupplierStatus ?? 'null'} → {entry.newSupplierStatus}
        </span>
      </div>
      <div>
        <span className="text-muted-foreground">WB статус: </span>
        <span>
          {entry.oldWbStatus ?? 'null'} → {entry.newWbStatus}
        </span>
      </div>
    </div>
  )
}

function TabLoadingSkeleton() {
  return (
    <div className="space-y-3">
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

function TabErrorState({ onRetry }: { onRetry: () => void }) {
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>{message}</p>
    </div>
  )
}

function formatHistoryTimestamp(isoDate: string): string {
  const date = new Date(isoDate)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${day}.${month}.${year} ${hours}:${minutes}`
}
