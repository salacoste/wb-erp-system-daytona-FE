/** HealthReportSheet — Side panel with health report detail. Epic 68-FE (Story 68.7) */

'use client'

import type { RefObject } from 'react'
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
  returnFocusRef?: RefObject<HTMLElement | null>
}

const STATUS_CFG: Record<OverallStatus, { label: string; cls: string }> = {
  healthy: {
    label: 'Здоровая',
    cls: 'bg-status-success/10 text-status-success border-status-success/40',
  },
  degraded: {
    label: 'Деградация',
    cls: 'bg-status-warning/10 text-status-warning border-status-warning/40',
  },
  critical: {
    label: 'Критично',
    cls: 'bg-status-error/10 text-status-error border-status-error/40',
  },
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function HealthReportSheet({
  date,
  open,
  onOpenChange,
  returnFocusRef,
}: HealthReportSheetProps) {
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
      <SheetContent
        side="right"
        size="wide"
        aria-label="Отчёт о здоровье системы"
        onCloseAutoFocus={event => {
          if (!returnFocusRef?.current) return
          event.preventDefault()
          returnFocusRef.current.focus()
        }}
      >
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
