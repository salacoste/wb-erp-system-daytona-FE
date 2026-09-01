/**
 * Monitor Metrics Table — 4 Periods
 * Epic 92-FE Story 92.3: 7-row × 4-column comparison table.
 *
 * Null-vs-zero (CLAUDE.md anti-pattern #8): money null → "—", counts 0 → "0".
 * Delta: previous === 0 → "—" (no division by zero).
 * Anomaly: cogs > revenue OR margin > revenue → AlertTriangle with per-period tooltip (fix H-2).
 * Lag badge: today stale when salesCount === 0 && returnsCount === 0.
 * buildRows/computeDelta/hasAnomaly/getAnomalyPeriods extracted to monitor-metrics-utils.ts.
 */

'use client'

import { AlertTriangle } from 'lucide-react'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import type { MonitorSummaryResponse } from '../types/monitor-summary'
import { computeDelta, getAnomalyPeriods, buildRows } from './monitor-metrics-utils'

function formatValue(v: number | null, isMoney: boolean): string {
  if (v == null) return '—'
  return isMoney ? formatCurrency(v) : v.toLocaleString('ru-RU')
}

/** Per-cell helper: red class when this is the margin row and value is negative (fix M-1). */
function getNegativeMarginClass(isMargin: boolean, value: number | null): string {
  return isMargin && value != null && value < 0 ? 'text-status-error' : ''
}

export function MonitorMetricsTable({ periods }: { periods: MonitorSummaryResponse['periods'] }) {
  const { today } = periods

  const todayIsLagging = today.salesCount === 0 && today.returnsCount === 0
  const anomalousPeriods = getAnomalyPeriods(periods)

  const rows = buildRows(periods)

  return (
    <div className="rounded-md border" data-testid="table-metrics-4-periods">
      <Table
        scrollContainerTabIndex={0}
        scrollContainerAriaLabel="Сводная таблица метрик за 4 периода"
      >
        <TableCaption className="sr-only">Сводная таблица метрик за 4 периода</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Показатель</TableHead>
            <TableHead>
              Сегодня
              {todayIsLagging && (
                <Badge
                  variant="outline"
                  className="ml-2 border-status-warning/50 bg-status-warning/10 text-foreground"
                >
                  Нет данных за сегодня
                </Badge>
              )}
            </TableHead>
            <TableHead>Вчера</TableHead>
            <TableHead>30 дней</TableHead>
            <TableHead>Пред. 30 дней</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(row => {
            const todayDelta = computeDelta(row.values.today, row.values.yesterday, row.direction)
            const last30Delta = computeDelta(row.values.last30, row.values.prev30, row.direction)
            const isMargin = row.key === 'margin'
            return (
              <TableRow key={row.key}>
                <TableCell className="font-medium">
                  <span>{row.label}</span>
                  {row.subtitle && (
                    <span className="block text-xs text-muted-foreground font-normal">
                      {row.subtitle}
                    </span>
                  )}
                  {isMargin && anomalousPeriods.length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center cursor-help">
                            <AlertTriangle
                              className="ml-2 h-4 w-4 text-status-warning"
                              aria-label="Аномалия данных"
                            />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs max-w-sm space-y-1">
                            <p className="font-medium">Аномалия в период(ы):</p>
                            <ul className="list-disc list-inside">
                              {anomalousPeriods.map(p => (
                                <li key={p.key}>
                                  <strong>{p.label}</strong>
                                  {p.cogs != null && p.revenue != null && p.cogs > p.revenue && (
                                    <>
                                      : себестоимость ({formatCurrency(p.cogs)}) больше выручки (
                                      {formatCurrency(p.revenue)})
                                    </>
                                  )}
                                  {p.margin != null &&
                                    p.revenue != null &&
                                    p.margin > p.revenue && (
                                      <>
                                        : маржа ({formatCurrency(p.margin)}) больше выручки (
                                        {formatCurrency(p.revenue)})
                                      </>
                                    )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
                <TableCell
                  className={getNegativeMarginClass(isMargin, row.values.today) || undefined}
                >
                  {formatValue(row.values.today, row.isMoney)}
                  {todayDelta.arrow != null && (
                    <span className={`ml-2 text-xs ${todayDelta.colorClass}`}>
                      {todayDelta.arrow} {todayDelta.label}
                    </span>
                  )}
                </TableCell>
                <TableCell
                  className={getNegativeMarginClass(isMargin, row.values.yesterday) || undefined}
                >
                  {formatValue(row.values.yesterday, row.isMoney)}
                </TableCell>
                <TableCell
                  className={getNegativeMarginClass(isMargin, row.values.last30) || undefined}
                >
                  {formatValue(row.values.last30, row.isMoney)}
                  {last30Delta.arrow != null && (
                    <span className={`ml-2 text-xs ${last30Delta.colorClass}`}>
                      {last30Delta.arrow} {last30Delta.label}
                    </span>
                  )}
                </TableCell>
                <TableCell
                  className={getNegativeMarginClass(isMargin, row.values.prev30) || undefined}
                >
                  {formatValue(row.values.prev30, row.isMoney)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
