/** Sync Gaps Timeline — Story 73.5-FE: visual data coverage indicator */
'use client'

import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatPercentageInt } from '@/lib/utils'
import type { SyncStatusResponse } from '@/types/advertising-analytics'
import { deriveDayStatuses, calculateCoverage, type DayStatusType } from '../utils/sync-gaps-utils'

interface SyncGapsTimelineProps {
  from: string
  to: string
  syncStatus?: SyncStatusResponse
}

const STATUS_CONFIG: Record<DayStatusType, { bg: string; label: string }> = {
  complete: { bg: 'bg-green-500', label: 'Данные есть' },
  missing: { bg: 'bg-red-500', label: 'Нет данных' },
  unavailable: { bg: 'bg-gray-300', label: 'За пределами синхронизации' },
}

export function SyncGapsTimeline({ from, to, syncStatus }: SyncGapsTimelineProps) {
  const [expanded, setExpanded] = useState(false)

  const statuses = useMemo(() => {
    if (!syncStatus) return []
    return deriveDayStatuses(
      from,
      to,
      syncStatus.dataGaps,
      syncStatus.dataAvailableFrom,
      syncStatus.dataAvailableTo
    )
  }, [from, to, syncStatus])

  const coverage = useMemo(() => calculateCoverage(statuses), [statuses])
  const hasCoverage = statuses.length > 0

  const coverageColor =
    coverage.percent === 100
      ? 'text-green-600'
      : coverage.percent >= 80
        ? 'text-yellow-600'
        : 'text-red-600'

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? 'Скрыть покрытие данных' : 'Показать покрытие данных'}
      </button>

      <div
        aria-hidden={!expanded}
        className={cn(
          'overflow-hidden transition-all duration-200',
          expanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {hasCoverage ? (
          <div className="space-y-2 pt-2">
            <TooltipProvider delayDuration={100}>
              <div className="flex gap-px">
                {statuses.map(day => {
                  const config = STATUS_CONFIG[day.status]
                  const label = format(parseISO(day.date), 'dd.MM.yyyy', { locale: ru })
                  return (
                    <Tooltip key={day.date}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn('h-5 flex-1 min-w-[3px] rounded-sm', config.bg)}
                          aria-label={`${label} — ${config.label}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        {label} — {config.label}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </TooltipProvider>

            <p className={cn('text-xs', coverageColor)}>
              Синхронизировано {coverage.synced} из {coverage.total} дней (
              {formatPercentageInt(coverage.percent)})
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground pt-2">Нет информации о покрытии</p>
        )}
      </div>
    </div>
  )
}
