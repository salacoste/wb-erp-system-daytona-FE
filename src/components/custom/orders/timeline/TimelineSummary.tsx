/**
 * TimelineSummary Component
 * Story 40.5-FE: History Timeline Components
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Summary section for timeline views showing statistics.
 *
 * @see docs/stories/epic-40/story-40.5-fe-history-timeline-components.md#AC7
 */

import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/duration-utils'
import { getWbStatusLabel } from '@/lib/wb-status-mapping'
import { formatHistoryTimestamp } from './timeline-utils'

export type TimelineSummaryVariant = 'full' | 'wb' | 'local'

export interface FullSummaryData {
  totalCount: number
  wbCount: number
  localCount: number
  firstTimestamp: string | null
  lastTimestamp: string | null
}

export interface WbSummaryData {
  totalTransitions: number
  totalDurationMinutes: number | null
  currentWbStatus: string | null
}

export interface LocalSummaryData {
  totalTransitions: number
  createdAt: string
  completedAt: string | null
}

export interface TimelineSummaryProps {
  variant: TimelineSummaryVariant
  fullData?: FullSummaryData
  wbData?: WbSummaryData
  localData?: LocalSummaryData
  className?: string
}

/**
 * TimelineSummary - Shows summary statistics for timeline
 */
export function TimelineSummary({
  variant,
  fullData,
  wbData,
  localData,
  className,
}: TimelineSummaryProps) {
  return (
    <div className={cn('bg-muted/50 rounded-md p-3 text-sm', className)}>
      {variant === 'full' && fullData && <FullSummaryContent data={fullData} />}
      {variant === 'wb' && wbData && <WbSummaryContent data={wbData} />}
      {variant === 'local' && localData && <LocalSummaryContent data={localData} />}
    </div>
  )
}

function FullSummaryContent({ data }: { data: FullSummaryData }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      <span className="font-medium">Всего: {data.totalCount} записей</span>
      <span className="text-muted-foreground">|</span>
      <span>WB: {data.wbCount}</span>
      <span className="text-muted-foreground">|</span>
      <span>Локальная: {data.localCount}</span>
      {data.firstTimestamp && data.lastTimestamp && (
        <>
          <span className="hidden sm:inline text-muted-foreground">|</span>
          <span className="hidden sm:inline">
            Период: {formatHistoryTimestamp(data.firstTimestamp)} —{' '}
            {formatHistoryTimestamp(data.lastTimestamp)}
          </span>
        </>
      )}
    </div>
  )
}

function WbSummaryContent({ data }: { data: WbSummaryData }) {
  const totalDuration = data.totalDurationMinutes ? formatDuration(data.totalDurationMinutes) : null

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      <span className="font-medium">Переходов: {data.totalTransitions}</span>
      {totalDuration && (
        <>
          <span className="text-muted-foreground">|</span>
          <span>Общее время: {totalDuration}</span>
        </>
      )}
      {data.currentWbStatus && (
        <>
          <span className="text-muted-foreground">|</span>
          <span>Текущий статус: {getWbStatusLabel(data.currentWbStatus)}</span>
        </>
      )}
    </div>
  )
}

function LocalSummaryContent({ data }: { data: LocalSummaryData }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      <span className="font-medium">Переходов: {data.totalTransitions}</span>
      <span className="text-muted-foreground">|</span>
      <span>Создан: {formatHistoryTimestamp(data.createdAt)}</span>
      {data.completedAt ? (
        <>
          <span className="text-muted-foreground">|</span>
          <span>Завершён: {formatHistoryTimestamp(data.completedAt)}</span>
        </>
      ) : (
        <>
          <span className="text-muted-foreground">|</span>
          <span className="text-yellow-600">В процессе</span>
        </>
      )}
    </div>
  )
}
