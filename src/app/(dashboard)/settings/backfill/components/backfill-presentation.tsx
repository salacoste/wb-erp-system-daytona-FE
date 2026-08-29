import type { ReactNode } from 'react'

import { PageState } from '@/components/product/states'
import type { TableNumericColumnContract } from '@/components/product/tables/contracts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { BackfillCabinetStatus, BackfillStatus } from '@/types/backfill'

export const BACKFILL_NUMERIC_COLUMNS = [
  {
    id: 'progress',
    label: 'Прогресс',
    alignment: 'end',
    precision: '1 fraction digits',
    unit: { kind: 'percent' },
    tabularNumerals: true,
    fullValueAccess: 'visible',
  },
  {
    id: 'eta',
    label: 'ETA',
    alignment: 'end',
    precision: 'caller-preserved',
    unit: { kind: 'quantity', label: 'время' },
    tabularNumerals: true,
    fullValueAccess: 'visible',
  },
] satisfies readonly TableNumericColumnContract[]

export function BackfillPageSkeleton() {
  return (
    <div className="space-y-6 py-2" aria-busy="true" aria-label="Загрузка страницы бэкфилла">
      <div className="space-y-3">
        <Skeleton className="h-4 w-48 motion-reduce:animate-none" data-testid="skeleton" />
        <Skeleton
          className="h-8 w-64 max-w-full motion-reduce:animate-none"
          data-testid="skeleton"
        />
        <Skeleton
          className="h-4 w-96 max-w-full motion-reduce:animate-none"
          data-testid="skeleton"
        />
      </div>
      <Skeleton className="h-24 w-full motion-reduce:animate-none" data-testid="skeleton" />
      <Skeleton className="h-96 w-full motion-reduce:animate-none" data-testid="skeleton" />
    </div>
  )
}

const STATUS_PRESENTATION: Record<BackfillStatus, { label: string; className: string }> = {
  idle: { label: 'Ожидает', className: 'border-border bg-muted text-muted-foreground' },
  not_started: { label: 'Не начат', className: 'border-border bg-muted text-muted-foreground' },
  pending: {
    label: 'В очереди',
    className: 'border-status-warning/40 bg-status-warning/10 text-foreground',
  },
  in_progress: {
    label: 'Выполняется',
    className: 'border-status-information/40 bg-status-information/10 text-foreground',
  },
  completed: {
    label: 'Завершено',
    className: 'border-status-success/40 bg-status-success/10 text-foreground',
  },
  failed: {
    label: 'Ошибка',
    className: 'border-status-error/40 bg-status-error/10 text-foreground',
  },
  paused: {
    label: 'Приостановлено',
    className: 'border-status-warning/40 bg-status-warning/10 text-foreground',
  },
}

export function getCombinedProgressStatus(cabinet: BackfillCabinetStatus): BackfillStatus {
  const statuses = [cabinet.status, cabinet.analytics_status]
  if (statuses.includes('failed')) return 'failed'
  if (statuses.includes('in_progress')) return 'in_progress'
  if (statuses.includes('pending')) return 'pending'
  if (statuses.includes('paused')) return 'paused'
  if (statuses.every(status => status === 'completed')) return 'completed'
  if (statuses.every(status => status === 'not_started')) return 'not_started'
  return 'idle'
}

export function BackfillInitialLoadingState() {
  return (
    <PageState
      state="loading"
      title="Загружаем состояние бэкфилла"
      explanation="Загружаем состояние бэкфилла: получаем актуальные статусы отчётов и аналитики по кабинетам."
      trust="Сводка появится только после успешного ответа сервера."
    />
  )
}

type RefreshRetryProps = { isRefreshing: boolean; onRetry: () => void }

export function BackfillInitialErrorState({ isRefreshing, onRetry }: RefreshRetryProps) {
  return (
    <PageState
      state="error"
      title="Не удалось загрузить состояние бэкфилла"
      explanation="Сервер не вернул статусы кабинетов."
      trust="Сводка и список скрыты, чтобы ошибка не выглядела как пустой результат."
      recovery={
        <Button onClick={onRetry} disabled={isRefreshing} aria-busy={isRefreshing}>
          {isRefreshing ? 'Загрузка…' : 'Повторить загрузку'}
        </Button>
      }
    />
  )
}

export function BackfillStaleState({
  children,
  isRefreshing,
  lastUpdated,
  onRetry,
}: {
  children: ReactNode
  isRefreshing: boolean
  lastUpdated: string | null
  onRetry: () => void
}) {
  return (
    <PageState
      state="stale"
      title="Показаны ранее полученные данные"
      explanation="Последняя попытка обновить статусы завершилась ошибкой."
      trust={
        lastUpdated
          ? `Последнее успешное обновление: ${lastUpdated} (МСК).`
          : 'Сохранён последний успешный ответ сервера.'
      }
      limitation="Текущие статусы могли измениться; повторите обновление перед важным действием."
      action={
        <Button onClick={onRetry} disabled={isRefreshing} aria-busy={isRefreshing}>
          {isRefreshing ? 'Обновление…' : 'Повторить обновление'}
        </Button>
      }
    >
      {children}
    </PageState>
  )
}

function StatusBadge({ status }: { status: BackfillStatus }) {
  const presentation = STATUS_PRESENTATION[status]
  return (
    <Badge data-slot="backfill-status-badge" variant="outline" className={presentation.className}>
      {presentation.label}
    </Badge>
  )
}

export function PipelineStatuses({ cabinet }: { cabinet: BackfillCabinetStatus }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span>Отчёты</span>
        <StatusBadge status={cabinet.status} />
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span>Аналитика</span>
        <StatusBadge status={cabinet.analytics_status} />
      </div>
    </div>
  )
}

export function BackfillTableSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <span className="sr-only">Загружаем состояние бэкфилла</span>
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-6 w-32 motion-reduce:animate-none" />
          <Skeleton className="h-6 w-20 motion-reduce:animate-none" />
          <Skeleton className="h-2 w-40 motion-reduce:animate-none" />
          <Skeleton className="h-6 w-16 motion-reduce:animate-none" />
          <Skeleton className="h-11 w-24 motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  )
}

export function BackfillEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-lg font-medium text-foreground">Нет кабинетов для бэкфилла</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Создайте кабинет для начала загрузки исторических данных
      </p>
    </div>
  )
}
