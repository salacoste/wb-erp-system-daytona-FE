/** HealthReportSheet sub-components — extracted for file size compliance. Epic 68-FE */

'use client'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatPercentageInt } from '@/lib/utils'
import { healthReportSuccessCount } from './health-report-utils'
import type { HealthReportDetail } from '../types/monitoring'

const SEV_CFG: Record<string, { label: string; cls: string }> = {
  critical: {
    label: 'Критично',
    cls: 'bg-status-error/10 text-status-error border-status-error/40',
  },
  warning: {
    label: 'Внимание',
    cls: 'bg-status-warning/10 text-status-warning border-status-warning/40',
  },
  info: {
    label: 'Инфо',
    cls: 'bg-status-information/10 text-status-information border-status-information/40',
  },
}

export function SheetBody({ report }: { report: HealthReportDetail }) {
  const { issues, recommendations, summary } = report
  const completenessAvg = summary.dataCompletenessAvg ?? 0
  const successCount = healthReportSuccessCount(summary)
  return (
    <div className="mt-6 space-y-5">
      <section aria-label="Выполнение задач">
        <h4 className="mb-2 text-sm font-semibold">Выполнение задач</h4>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Metric label="Успешно" value={successCount} color="text-status-success" />
          <Metric label="Ошибки" value={summary.tasksFailed} color="text-status-error" />
          <Metric label="Ожидают" value={summary.tasksPending} color="text-muted-foreground" />
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
                <span className={info.status === 'critical' ? 'text-status-error' : ''}>
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
                    <Badge className={cn('text-xs', sev.cls)}>{sev.label}</Badge>
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

export function SheetSkeleton() {
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
