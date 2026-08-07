/**
 * Backfill Status Table Component
 * Story 51.11-FE: Backfill Admin Page
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Table displaying backfill status for all cabinets
 */

'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { BackfillCabinetStatus, BackfillRetrySource } from '@/types/backfill'
import { getStatusConfig, formatEstimatedTime } from '@/lib/backfill-utils'
import { BackfillProgressBar } from './BackfillProgressBar'
import { BackfillControlButtons } from './BackfillControlButtons'
import { BackfillErrorLog } from './BackfillErrorLog'
import { BackfillRetryControls } from './BackfillRetryControls'

interface BackfillStatusTableProps {
  cabinets: BackfillCabinetStatus[]
  isLoading?: boolean
  onPause: (cabinetId: string) => void
  onResume: (cabinetId: string) => void
  onRetry: (cabinetId: string) => void
  /** Story 165.5: per-source retry callback (separate report/analytics endpoints). */
  onRetrySource?: (cabinetId: string, dataSource: BackfillRetrySource) => void
  pausingCabinetId?: string | null
  resumingCabinetId?: string | null
  retryingCabinetId?: string | null
  /** Story 165.5: `"${cabinetId}:${dataSource}"` keys currently in-flight. */
  retryingSourceKeys?: Set<string>
}

/**
 * Status badge with appropriate color
 */
function StatusBadge({ status }: { status: BackfillCabinetStatus['status'] }) {
  const config = getStatusConfig(status)
  return <Badge className={`${config.bgColor} ${config.color} border-0`}>{config.label}</Badge>
}

/**
 * Loading skeleton for table
 */
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-2 w-40" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  )
}

/**
 * Empty state when no cabinets
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-lg font-medium text-foreground">Нет кабинетов для бэкфилла</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Создайте кабинет для начала загрузки исторических данных
      </p>
    </div>
  )
}

/**
 * Table displaying backfill status for all cabinets with controls
 */
export function BackfillStatusTable({
  cabinets,
  isLoading = false,
  onPause,
  onResume,
  onRetry,
  onRetrySource,
  pausingCabinetId,
  resumingCabinetId,
  retryingCabinetId,
  retryingSourceKeys,
}: BackfillStatusTableProps) {
  if (isLoading) {
    return <TableSkeleton />
  }

  if (cabinets.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table scrollContainerTabIndex={0} scrollContainerAriaLabel="Таблица статусов бэкфилла">
        <TableHeader>
          <TableRow>
            <TableHead>Кабинет</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="w-[200px]">Прогресс</TableHead>
            <TableHead>ETA</TableHead>
            <TableHead>Ошибки</TableHead>
            <TableHead>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cabinets.map(cabinet => (
            <TableRow
              key={cabinet.cabinet_id}
              // F-29: highlight on EITHER backfill failing so an analytics-only
              // failure isn't visually swallowed. Per-source retry is now live
              // (Story 165.5: BackfillRetryControls → /report/retry | /analytics/retry);
              // the failed-state retry path is per-source, never cabinet-wide.
              className={
                cabinet.status === 'failed' || cabinet.analytics_status === 'failed'
                  ? 'bg-red-50'
                  : undefined
              }
            >
              <TableCell className="font-medium">{cabinet.cabinet_name}</TableCell>
              {/* F-29: reports + analytics backfill are tracked separately by the
                  backend; show both instead of only reports. */}
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    Отчёты:
                    <StatusBadge status={cabinet.status} />
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    Аналитика:
                    <StatusBadge status={cabinet.analytics_status} />
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <BackfillProgressBar
                  progress={cabinet.progress?.percentage ?? 0}
                  status={cabinet.status}
                />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatEstimatedTime(cabinet.progress?.estimated_remaining_seconds ?? null)}
              </TableCell>
              <TableCell>
                <BackfillErrorLog cabinet={cabinet} />
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1.5">
                  <BackfillControlButtons
                    cabinet={cabinet}
                    onPause={onPause}
                    onResume={onResume}
                    onRetry={onRetry}
                    isPausing={pausingCabinetId === cabinet.cabinet_id}
                    isResuming={resumingCabinetId === cabinet.cabinet_id}
                    isRetrying={retryingCabinetId === cabinet.cabinet_id}
                  />
                  {onRetrySource && (
                    <BackfillRetryControls
                      cabinet={cabinet}
                      retryingKeys={retryingSourceKeys ?? new Set()}
                      onRetry={onRetrySource}
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default BackfillStatusTable
