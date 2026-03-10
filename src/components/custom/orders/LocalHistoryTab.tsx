/**
 * Local History Tab Component
 * Story 40.4-FE: Order Details Modal
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Displays local status history with supplier_status and wb_status transitions.
 * Shows duration between transitions and summary.
 */

'use client'

import type { LocalHistoryResponse } from '@/types/orders-history'
import { formatDuration, TabErrorState, EmptyState } from './history-utils'
import {
  SummarySection,
  CurrentStatusSection,
  LocalHistoryTimelineEntry,
  TabLoadingSkeleton,
} from './LocalHistoryEntryItem'

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
