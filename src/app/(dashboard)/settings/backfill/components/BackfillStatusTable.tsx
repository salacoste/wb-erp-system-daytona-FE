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
import type { BackfillCabinetStatus } from '@/types/backfill'
import { getStatusConfig, formatEstimatedTime } from '@/lib/backfill-utils'
import { BackfillProgressBar } from './BackfillProgressBar'
import { BackfillControlButtons } from './BackfillControlButtons'
import { BackfillErrorLog } from './BackfillErrorLog'

interface BackfillStatusTableProps {
  cabinets: BackfillCabinetStatus[]
  isLoading?: boolean
  onPause: (cabinetId: string) => void
  onResume: (cabinetId: string) => void
  onRetry: (cabinetId: string) => void
  pausingCabinetId?: string | null
  resumingCabinetId?: string | null
  retryingCabinetId?: string | null
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
      <p className="text-lg font-medium text-gray-900">Нет кабинетов для бэкфилла</p>
      <p className="mt-1 text-sm text-gray-500">
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
  pausingCabinetId,
  resumingCabinetId,
  retryingCabinetId,
}: BackfillStatusTableProps) {
  if (isLoading) {
    return <TableSkeleton />
  }

  if (cabinets.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="rounded-md border">
      <Table>
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
              className={cabinet.status === 'failed' ? 'bg-red-50' : undefined}
            >
              <TableCell className="font-medium">{cabinet.cabinet_name}</TableCell>
              <TableCell>
                <StatusBadge status={cabinet.status} />
              </TableCell>
              <TableCell>
                <BackfillProgressBar
                  progress={cabinet.progress?.percentage ?? 0}
                  status={cabinet.status}
                />
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatEstimatedTime(cabinet.progress?.estimated_remaining_seconds ?? null)}
              </TableCell>
              <TableCell>
                <BackfillErrorLog cabinet={cabinet} onRetry={onRetry} />
              </TableCell>
              <TableCell>
                <BackfillControlButtons
                  cabinet={cabinet}
                  onPause={onPause}
                  onResume={onResume}
                  onRetry={onRetry}
                  isPausing={pausingCabinetId === cabinet.cabinet_id}
                  isResuming={resumingCabinetId === cabinet.cabinet_id}
                  isRetrying={retryingCabinetId === cabinet.cabinet_id}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default BackfillStatusTable
