/** HealthHistoryChart — Timeline of health history. Epic 68-FE (Story 68.7) */

'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { getHealthReports, monitoringQueryKeys } from '@/lib/api/monitoring'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { HealthReportSheet } from './HealthReportSheet'
import type { HealthReportSummary, OverallStatus } from '../types/monitoring'

interface HealthHistoryChartProps {
  enabled: boolean
}

type PeriodDays = 7 | 14 | 30

const PERIOD_OPTIONS: { days: PeriodDays; label: string }[] = [
  { days: 7, label: '7 дней' },
  { days: 14, label: '14 дней' },
  { days: 30, label: '30 дней' },
]

const STATUS_COLORS: Record<OverallStatus, string> = {
  healthy: 'bg-green-500',
  degraded: 'bg-yellow-500',
  critical: 'bg-red-500',
}

const STATUS_RING: Record<OverallStatus, string> = {
  healthy: 'ring-green-300',
  degraded: 'ring-yellow-300',
  critical: 'ring-red-300',
}

const STATUS_EMOJI: Record<OverallStatus, string> = {
  healthy: '\u2705',
  degraded: '\u26A0\uFE0F',
  critical: '\u274C',
}

function formatDayLabel(dateStr: string): { day: string; date: string } {
  const d = new Date(dateStr)
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  return {
    day: days[d.getDay()],
    date: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
  }
}

/** Count reports by status for trend summary */
function countByStatus(reports: HealthReportSummary[]) {
  let healthy = 0
  let degraded = 0
  let critical = 0
  for (const r of reports) {
    if (r.status === 'healthy') healthy++
    else if (r.status === 'degraded') degraded++
    else critical++
  }
  return { healthy, degraded, critical }
}

export function HealthHistoryChart({ enabled }: HealthHistoryChartProps) {
  const cabinetId = useAuthStore(state => state.cabinetId)
  const [period, setPeriod] = useState<PeriodDays>(7)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data: reports, isLoading } = useQuery<HealthReportSummary[]>({
    queryKey: monitoringQueryKeys.healthReports(cabinetId ?? '', period),
    queryFn: () => getHealthReports(cabinetId!, period),
    enabled: enabled && !!cabinetId,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 1,
  })

  const counts = useMemo(() => (reports ? countByStatus(reports) : null), [reports])

  function handleCircleClick(date: string) {
    setSelectedDate(date)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-4" role="region" aria-label="История здоровья системы">
      {/* Period selector */}
      <div className="flex items-center gap-2" role="radiogroup" aria-label="Период">
        {PERIOD_OPTIONS.map(opt => (
          <Button
            key={opt.days}
            variant={period === opt.days ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(opt.days)}
            aria-pressed={period === opt.days}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <TimelineSkeleton count={period} />
      ) : !reports?.length ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Нет данных за выбранный период
        </p>
      ) : (
        <>
          {/* Trend summary */}
          {counts && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              За последние {period} дней:{' '}
              <span className="font-medium text-green-600">
                {counts.healthy} дн. {STATUS_EMOJI.healthy}
              </span>
              {', '}
              <span className="font-medium text-yellow-600">
                {counts.degraded} дн. {STATUS_EMOJI.degraded}
              </span>
              {', '}
              <span className="font-medium text-red-600">
                {counts.critical} дн. {STATUS_EMOJI.critical}
              </span>
            </p>
          )}

          {/* Timeline */}
          <div
            className="flex flex-wrap gap-3"
            role="list"
            aria-label={`Дневная история за ${period} дней`}
          >
            {reports.map(report => {
              const { day, date } = formatDayLabel(report.date)
              const isSelected = report.date === selectedDate && sheetOpen
              return (
                <button
                  key={report.date}
                  type="button"
                  className="group flex flex-col items-center gap-1 rounded-lg p-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => handleCircleClick(report.date)}
                  aria-label={`${day} ${date}: ${report.status}, проблем: ${report.issues}`}
                  role="listitem"
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white transition-all',
                      STATUS_COLORS[report.status],
                      isSelected && `ring-2 ${STATUS_RING[report.status]}`,
                      'group-hover:scale-110'
                    )}
                    aria-hidden="true"
                  >
                    {report.issues}
                  </div>
                  <span className="text-[10px] font-medium leading-tight text-muted-foreground">
                    {day}
                  </span>
                  <span className="text-[10px] leading-tight text-muted-foreground">{date}</span>
                  {report.issues > 0 && (
                    <span className="text-[10px] font-medium text-red-500">
                      {report.issues} {report.issues === 1 ? 'пробл.' : 'пробл.'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Detail Sheet */}
      <HealthReportSheet date={selectedDate} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}

function TimelineSkeleton({ count }: { count: number }) {
  const shown = Math.min(count, 14)
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-4 w-64" />
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: shown }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-2.5 w-6" />
            <Skeleton className="h-2.5 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}
