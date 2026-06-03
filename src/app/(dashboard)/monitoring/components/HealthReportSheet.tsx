/** HealthReportSheet — Side panel with health report detail. Epic 68-FE (Story 68.7) */

'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { getHealthReport, monitoringQueryKeys } from '@/lib/api/monitoring'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatPercentageInt } from '@/lib/utils'
import { healthReportSuccessCount } from './health-report-utils'
import type { HealthReportDetail, OverallStatus } from '../types/monitoring'

interface HealthReportSheetProps {
  date: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_CFG: Record<OverallStatus, { label: string; cls: string }> = {
  healthy: { label: 'Здоровая', cls: 'bg-green-100 text-green-700 border-green-200' },
  degraded: { label: 'Деградация', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  critical: { label: 'Критично', cls: 'bg-red-100 text-red-700 border-red-200' },
}

const SEV_CFG: Record<string, { label: string; cls: string }> = {
  critical: { label: 'Критично', cls: 'bg-red-100 text-red-700 border-red-200' },
  warning: { label: 'Внимание', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  info: { label: 'Инфо', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function HealthReportSheet({ date, open, onOpenChange }: HealthReportSheetProps) {
  const cabinetId = useAuthStore(s => s.cabinetId)
  const { data: report, isLoading } = useQuery<HealthReportDetail>({
    queryKey: monitoringQueryKeys.healthReport(cabinetId ?? '', date ?? ''),
    queryFn: () => getHealthReport(cabinetId!, date!),
    enabled: open && !!cabinetId && !!date,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
  })

  const st = report ? STATUS_CFG[report.summary.overallStatus] : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="wide" aria-label="Отчёт о здоровье системы">
        <SheetHeader>
          <SheetTitle>{date ? fmtDate(date) : 'Отчёт'}</SheetTitle>
          <SheetDescription asChild>
            <div className="text-sm text-muted-foreground">
              {st ? (
                <Badge className={cn('mt-1', st.cls)}>
                  {st.label} — {formatPercentageInt(report?.summary.dataCompletenessAvg ?? 0)}
                </Badge>
              ) : (
                'Загрузка данных...'
              )}
            </div>
          </SheetDescription>
        </SheetHeader>
        {isLoading ? <SheetSkeleton /> : report ? <SheetBody report={report} /> : null}
      </SheetContent>
    </Sheet>
  )
}

function SheetBody({ report }: { report: HealthReportDetail }) {
  const { issues, recommendations, summary } = report
  const completenessAvg = summary.dataCompletenessAvg ?? 0
  // tasksExecuted IS the success count (backend: success.length) — see health-report-utils.
  // The old `tasksExecuted − tasksFailed` wrongly subtracted failures from an already-success
  // count (live: showed 3 when 5 tasks succeeded). Do NOT subtract.
  const successCount = healthReportSuccessCount(summary)
  return (
    <div className="mt-6 space-y-5">
      <section aria-label="Выполнение задач">
        <h4 className="mb-2 text-sm font-semibold">Выполнение задач</h4>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Metric label="Успешно" value={successCount} color="text-green-600" />
          <Metric label="Ошибки" value={summary.tasksFailed} color="text-red-600" />
          <Metric label="Ожидают" value={summary.tasksPending} color="text-gray-500" />
        </div>
      </section>
      <Separator />
      <section aria-label="Полнота данных">
        <h4 className="mb-2 text-sm font-semibold">Полнота данных</h4>
        <div className="flex items-center gap-3">
          <Progress value={completenessAvg} className="h-2.5 flex-1" />
          <span
            className="text-sm font-medium"
            aria-label={`${formatPercentageInt(completenessAvg)} полноты данных`}
          >
            {formatPercentageInt(completenessAvg)}
          </span>
        </div>
        {/* Per-table breakdown */}
        {report.dataCompleteness && typeof report.dataCompleteness === 'object' && (
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {Object.entries(report.dataCompleteness).map(([table, info]) => (
              <li key={table} className="flex items-center justify-between">
                <span>{table}</span>
                <span className={info.status === 'critical' ? 'text-red-500' : ''}>
                  {formatPercentageInt(info.ratio * 100)}
                  {info.missingCount > 0 && ` (${info.missingCount} пробелов)`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Separator />
      <section aria-label="Проблемы">
        <h4 className="mb-2 text-sm font-semibold">
          Проблемы {issues.length > 0 && `(${issues.length})`}
        </h4>
        {issues.length === 0 ? (
          <p className="text-sm text-muted-foreground">Проблем не обнаружено</p>
        ) : (
          <ul className="space-y-2" role="list">
            {issues.map((issue, i) => {
              const sev = SEV_CFG[issue.severity] ?? SEV_CFG.info
              return (
                <li key={i} className="rounded-md border p-2.5 text-sm">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge className={cn('text-[10px]', sev.cls)}>{sev.label}</Badge>
                    <span className="text-xs text-muted-foreground">{issue.category}</span>
                  </div>
                  <p>{issue.description}</p>
                </li>
              )
            })}
          </ul>
        )}
      </section>
      {recommendations.length > 0 && (
        <>
          <Separator />
          <section aria-label="Рекомендации">
            <h4 className="mb-2 text-sm font-semibold">Рекомендации</h4>
            <ul
              className="list-inside list-disc space-y-1 text-sm text-muted-foreground"
              role="list"
            >
              {recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}

function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-md border p-2">
      <p className={cn('text-xl font-bold', color)}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function SheetSkeleton() {
  return (
    <div className="mt-6 space-y-5" aria-busy="true">
      <Skeleton className="h-4 w-32" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
      <Skeleton className="h-2.5 w-full" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}
