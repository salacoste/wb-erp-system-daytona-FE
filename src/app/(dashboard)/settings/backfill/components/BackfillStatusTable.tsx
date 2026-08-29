'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ResponsiveTable } from '@/components/product/tables'
import { formatEstimatedTime } from '@/lib/backfill-utils'
import { cn } from '@/lib/utils'
import type { BackfillCabinetStatus, BackfillRetrySource } from '@/types/backfill'

import { BackfillControlButtons } from './BackfillControlButtons'
import { BackfillErrorLog } from './BackfillErrorLog'
import { BackfillProgressBar } from './BackfillProgressBar'
import { BackfillRetryControls } from './BackfillRetryControls'
import {
  BACKFILL_NUMERIC_COLUMNS,
  BackfillEmptyState,
  BackfillTableSkeleton,
  getCombinedProgressStatus,
  PipelineStatuses,
} from './backfill-presentation'

interface BackfillStatusTableProps {
  cabinets: BackfillCabinetStatus[]
  isLoading?: boolean
  onPause: (cabinetId: string) => void
  onResume: (cabinetId: string) => void
  onRetry: (cabinetId: string) => void
  onRetrySource?: (cabinetId: string, dataSource: BackfillRetrySource) => void
  pausingCabinetId?: string | null
  resumingCabinetId?: string | null
  retryingCabinetId?: string | null
  retryingSourceKeys?: Set<string>
}

function CabinetActions({
  cabinet,
  onPause,
  onResume,
  onRetry,
  onRetrySource,
  pausingCabinetId,
  resumingCabinetId,
  retryingCabinetId,
  retryingSourceKeys,
}: Omit<BackfillStatusTableProps, 'cabinets' | 'isLoading'> & {
  cabinet: BackfillCabinetStatus
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
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
  )
}

export function BackfillStatusTable({
  cabinets,
  isLoading = false,
  ...actions
}: BackfillStatusTableProps) {
  if (isLoading) return <BackfillTableSkeleton />
  if (cabinets.length === 0) return <BackfillEmptyState />

  const narrowContent = (
    <div className="space-y-3">
      {cabinets.map(cabinet => {
        const hasFailure = cabinet.status === 'failed' || cabinet.analytics_status === 'failed'
        const progress = cabinet.progress?.percentage ?? 0
        const progressStatus = getCombinedProgressStatus(cabinet)
        return (
          <Card
            key={cabinet.cabinet_id}
            className={cn(hasFailure && 'border-status-error/40 bg-status-error/5')}
          >
            <CardHeader className="space-y-3 pb-3">
              <CardTitle className="break-words text-base">{cabinet.cabinet_name}</CardTitle>
              <PipelineStatuses cabinet={cabinet} />
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-3 text-sm">
                <div className="space-y-1">
                  <dt className="font-medium text-muted-foreground">Прогресс</dt>
                  <dd>
                    <BackfillProgressBar progress={progress} status={progressStatus} />
                  </dd>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <dt className="font-medium text-muted-foreground">Осталось</dt>
                  <dd className="tabular-nums text-foreground">
                    {formatEstimatedTime(cabinet.progress?.estimated_remaining_seconds ?? null)}
                  </dd>
                </div>
                {cabinet.last_error && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <dt className="font-medium text-muted-foreground">Ошибка</dt>
                    <dd>
                      <BackfillErrorLog cabinet={cabinet} />
                    </dd>
                  </div>
                )}
              </dl>
              <CabinetActions cabinet={cabinet} {...actions} />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  return (
    <>
      <div
        aria-label="Карточки состояния загрузки исторических данных по кабинетам"
        className="min-w-0 md:hidden"
        data-table-narrow-content
        role="group"
      >
        {narrowContent}
      </div>
      <div className="hidden min-w-0 rounded-md border bg-card md:block" data-table-wide-content>
        <ResponsiveTable
          caption="Состояние загрузки исторических данных по кабинетам"
          contract={{
            primaryColumn: { id: 'cabinet', label: 'Кабинет' },
            numericColumns: BACKFILL_NUMERIC_COLUMNS,
            sorting: { kind: 'none' },
            selection: { kind: 'none' },
            rowActions: {
              kind: 'caller-rendered',
              accessibleNamePattern: 'Действия бэкфилла для {entityId}',
            },
            narrowStrategy: {
              kind: 'horizontal-scroll',
              minimumWidth: '64rem',
              regionLabel: 'Горизонтальная прокрутка таблицы бэкфилла',
            },
            pagination: { kind: 'none' },
          }}
          className="[&_[role=region]]:focus-visible:outline-none [&_[role=region]]:focus-visible:ring-2 [&_[role=region]]:focus-visible:ring-ring [&_[role=region]]:focus-visible:ring-offset-2"
        >
          <TableHeader>
            <TableRow>
              <TableHead>Кабинет</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="w-[200px] text-right tabular-nums">Прогресс</TableHead>
              <TableHead className="text-right tabular-nums">ETA</TableHead>
              <TableHead>Ошибки</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cabinets.map(cabinet => {
              const hasFailure =
                cabinet.status === 'failed' || cabinet.analytics_status === 'failed'
              const progress = cabinet.progress?.percentage ?? 0
              const progressStatus = getCombinedProgressStatus(cabinet)
              return (
                <TableRow
                  key={cabinet.cabinet_id}
                  className={cn(hasFailure && 'bg-status-error/5')}
                >
                  <TableCell className="break-words font-medium">{cabinet.cabinet_name}</TableCell>
                  <TableCell>
                    <PipelineStatuses cabinet={cabinet} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <BackfillProgressBar progress={progress} status={progressStatus} />
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {formatEstimatedTime(cabinet.progress?.estimated_remaining_seconds ?? null)}
                  </TableCell>
                  <TableCell>
                    <BackfillErrorLog cabinet={cabinet} />
                  </TableCell>
                  <TableCell>
                    <CabinetActions cabinet={cabinet} {...actions} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </ResponsiveTable>
      </div>
    </>
  )
}
