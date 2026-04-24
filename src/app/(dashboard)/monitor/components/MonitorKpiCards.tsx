/**
 * Monitor KPI Cards
 * Epic 92-FE Story 92.2: KPI Cards + Route Registration
 *
 * Null-vs-zero discipline (CLAUDE.md anti-pattern #8):
 * - cogsCoveragePercent: null → render "—" (division undefined when totalProducts = 0)
 * - buyoutRatePercent: null → render "—" (no orders in window)
 * - totalProducts, productsWithCogs: counts → 0 is legitimate, never null per backend contract
 *
 * Anomaly indicator (AC-7 / Story 89.4 Defensive Frontend Principle):
 * - productsWithCogs > totalProducts is impossible per backend logic but defended at UI layer.
 */

'use client'

import { AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatPercentage } from '@/lib/utils'
import type { MonitorKpi } from '../types/monitor-summary'

interface MonitorKpiCardsProps {
  kpi: MonitorKpi
}

export function MonitorKpiCards({ kpi }: MonitorKpiCardsProps) {
  // Guard-capture pattern (CLAUDE.md anti-pattern #2): detect anomaly without ! assertion.
  const safeTotal = kpi.totalProducts
  const safeWithCogs = kpi.productsWithCogs
  // PENDING BACKEND: filing request if productsWithCogs > totalProducts recurs —
  // this indicates a data integrity issue on the WB side or backend aggregation bug.
  const hasCogsAnomaly = safeWithCogs > safeTotal

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Всего артикулов — L-3: role="region" fulfills AC-5 accessible markup */}
        <Card role="region" aria-label="Всего артикулов">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Всего артикулов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeTotal.toLocaleString('ru-RU')}</div>
          </CardContent>
        </Card>

        {/* Card 2: С COGS — L-3: role="region" fulfills AC-5 accessible markup */}
        <Card role="region" aria-label="С COGS">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">С COGS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {safeWithCogs.toLocaleString('ru-RU')}
              {/* Local TooltipProvider so anomaly indicator works even outside dashboard layout (review fix H-1). */}
              {hasCogsAnomaly && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center text-amber-500 cursor-help">
                        <AlertTriangle className="h-4 w-4" aria-label="Аномалия данных" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-sm">
                        Аномалия: количество артикулов с COGS ({safeWithCogs}) превышает общее (
                        {safeTotal}). Возможна ошибка данных на стороне WB.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Покрытие COGS — L-3: role="region" fulfills AC-5 accessible markup */}
        <Card role="region" aria-label="Покрытие COGS">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Покрытие COGS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpi.cogsCoveragePercent == null ? '—' : formatPercentage(kpi.cogsCoveragePercent)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Отношение артикулов с известной себестоимостью к общему числу
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Выкуп за 30 дней — L-3: role="region" fulfills AC-5 accessible markup */}
        <Card role="region" aria-label="Выкуп за 30 дней">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Выкуп за 30 дней
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpi.buyoutRatePercent == null ? '—' : formatPercentage(kpi.buyoutRatePercent)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Процент выкупленных заказов за последние 30 дней
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Optional "Updated X ago" footer using kpi.lastSyncAt only — M-3: generatedAt footer removed per AC-4 (review fix M-3). */}
      {kpi.lastSyncAt && (
        <p className="text-xs text-muted-foreground mt-4">
          Обновлено:{' '}
          {formatDistanceToNow(new Date(kpi.lastSyncAt), { addSuffix: true, locale: ru })}
        </p>
      )}
    </div>
  )
}
