/**
 * WB History Tab Component
 * Story 40.4-FE: Order Details Modal
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Displays WB native 40+ status history with colors from wb-status-mapping.
 * Shows duration between status transitions and summary.
 */

'use client'

import type { WbHistoryResponse } from '@/types/orders-history'
import { getWbStatusLabel } from '@/lib/wb-status-mapping'
import {
  formatDuration,
  WbHistoryTimelineEntry,
  TabLoadingSkeleton,
  TabErrorState,
  EmptyState,
} from './WbHistoryTabParts'

export interface WbHistoryTabProps {
  data: WbHistoryResponse | undefined
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/**
 * WB History Tab - WB native status codes with color-coded timeline
 */
export function WbHistoryTab({ data, isLoading, isError, refetch }: WbHistoryTabProps) {
  if (isLoading) {
    return <TabLoadingSkeleton />
  }

  if (isError) {
    return <TabErrorState onRetry={refetch} />
  }

  if (!data || data.wbHistory.length === 0) {
    return (
      <EmptyState message="WB история ещё не загружена. Синхронизация происходит каждые 15 минут." />
    )
  }

  const totalDuration = data.summary.totalDurationMinutes
    ? formatDuration(data.summary.totalDurationMinutes)
    : null

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="bg-muted/50 rounded-md p-3 text-sm">
        <span className="font-medium">Всего переходов: {data.summary.totalTransitions}</span>
        {totalDuration && (
          <>
            <span className="mx-2 text-muted-foreground">|</span>
            <span>Общее время: {totalDuration}</span>
          </>
        )}
        {data.summary.currentWbStatus && (
          <>
            <span className="mx-2 text-muted-foreground">|</span>
            <span>Текущий: {getWbStatusLabel(data.summary.currentWbStatus)}</span>
          </>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        {data.wbHistory.map((entry, index) => (
          <WbHistoryTimelineEntry
            key={entry.id}
            entry={entry}
            isLast={index === data.wbHistory.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
