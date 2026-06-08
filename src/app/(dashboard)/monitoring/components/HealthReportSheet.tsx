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
import { cn, formatPercentageInt } from '@/lib/utils'
import { SheetBody, SheetSkeleton } from './HealthReportSheetBody'
import type { OverallStatus } from '../types/monitoring'

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
  const { data: report, isLoading } = useQuery({
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
