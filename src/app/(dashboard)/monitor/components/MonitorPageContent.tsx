/**
 * Monitor Dashboard orchestrator
 * Epic 92-FE Story 92.2: KPI Cards + Route Registration
 * Epic 92-FE Story 92.4: Weekly Chart (parallel useDailyMetrics hook)
 * Epic 92-FE Story 92.5: Buyout Gauge + Pipeline Health (parallel usePipelineGrid hook)
 *
 * State machine mirrors Story 90.3/90.4's AcquiringReportDetailPage:
 *   showSkeleton  = isLoading && !hasData   (first-load, no cached data)
 *   showFullError = isError && !hasData     (hard error, nothing to show)
 *   inline chip   = isError && hasData      (refetch failed, showing stale data)
 *   success       = hasData                 (render KPI cards)
 *
 * Weekly chart (Story 92.4) runs a SEPARATE hook call (useDailyMetrics) in parallel.
 * Pipeline health (Story 92.5) runs a SEPARATE hook call (usePipelineGrid) in parallel.
 * Both are decoupled — KPI cards + metrics table remain visible if either fails.
 *
 * Auto-refresh cadences (do NOT change without coordinating backend TTLs):
 * - useMonitorSummary   → 5 min  (backend caches 10 min; refresh < TTL so cards stay warm)
 * - useDailyMetrics     → tanstack-query default (staleTime 60s per global QueryClient)
 * - usePipelineGrid     → 30s current-period / 120s historical (smart per use-pipeline-grid.ts:14-16)
 */

'use client'

import { format, subDays, subHours } from 'date-fns'
import { useMemo } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useMonitorSummary } from '../hooks/use-monitor-summary'
import { useDailyMetrics } from '@/hooks/useDailyMetrics'
import { usePipelineGrid } from '@/app/(dashboard)/monitoring/hooks/use-pipeline-grid'
import { MonitorKpiCards } from './MonitorKpiCards'
import { MonitorMetricsTable } from './MonitorMetricsTable'
import { MonitorWeeklyChart } from './MonitorWeeklyChart'
import { MonitorBuyoutGauge } from './MonitorBuyoutGauge'
import { MonitorPipelineHealth } from './MonitorPipelineHealth'

export function MonitorPageContent() {
  const { data, isLoading, isError, refetch } = useMonitorSummary()

  // Story 92.4: parallel 7-day window — INDEPENDENT from monitor-summary state machine.
  // Both hooks fire on mount; chart failure does NOT hide KPI cards or metrics table.
  // M-1 fix: memoized so the date window doesn't shift on every render.
  const { weekFrom, weekTo } = useMemo(() => {
    const t = new Date()
    return {
      weekFrom: format(subDays(t, 6), 'yyyy-MM-dd'),
      weekTo: format(t, 'yyyy-MM-dd'),
    }
  }, [])
  const dailyQuery = useDailyMetrics({ from: weekFrom, to: weekTo, mode: 'week' })
  const dailyData = dailyQuery.data ?? []

  // Story 92.5: parallel 24h pipeline window — INDEPENDENT state machine.
  // Pipeline failure does NOT hide KPI cards, table, chart, or gauge.
  // Memoized (same M-1 fix as weekFrom/weekTo) — prevents refetch storm on every render.
  const { pipelineFrom, pipelineTo } = useMemo(() => {
    const now = new Date()
    return {
      pipelineFrom: format(subHours(now, 24), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      pipelineTo: format(now, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    }
  }, [])
  const pipelineQuery = usePipelineGrid({ from: pipelineFrom, to: pipelineTo, resolution: 'day' })

  const hasData = !!data
  const showSkeleton = isLoading && !hasData
  // Belt-and-braces: don't flicker full-error over the skeleton during retry.
  // Mirrors Story 90.3's canonical state machine (review fix M-2).
  const showFullError = isError && !isLoading && !hasData

  return (
    <div className="space-y-6" data-testid="monitor-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Монитор</h1>
        <p className="text-muted-foreground mt-1">
          Обзор состояния кабинета и ключевые метрики за периоды
        </p>
      </div>

      {/* State machine */}
      {showSkeleton ? (
        <div className="space-y-4" role="status" aria-busy="true" aria-label="Загрузка метрик">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : showFullError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Не удалось загрузить метрики монитора. Попробуйте ещё раз.</span>
            <Button
              variant="outline"
              size="sm"
              className="ml-4 shrink-0"
              onClick={() => void refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Повторить
            </Button>
          </AlertDescription>
        </Alert>
      ) : hasData ? (
        <>
          {/* Inline refetch-error chip when we have cached data but the refetch failed */}
          {isError && (
            <div className="rounded-md border border-status-warning/40 bg-status-warning/10 px-4 py-2 text-sm text-status-warning flex items-center justify-between">
              <span>Не удалось обновить. Показаны кэшированные данные.</span>
              <Button variant="ghost" size="sm" onClick={() => void refetch()}>
                Повторить
              </Button>
            </div>
          )}
          <MonitorKpiCards kpi={data.kpi} />
          <MonitorMetricsTable periods={data.periods} />

          {/* Story 92.4: weekly chart — independent loading/error state */}
          {dailyQuery.isLoading && !dailyQuery.data && <Skeleton className="h-72 w-full" />}
          {dailyQuery.isError && !dailyQuery.data && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive flex items-center justify-between">
              <span>Не удалось загрузить график за 7 дней.</span>
              <Button variant="ghost" size="sm" onClick={() => void dailyQuery.refetch()}>
                Повторить
              </Button>
            </div>
          )}
          {dailyQuery.data && <MonitorWeeklyChart data={dailyData} />}

          {/* Story 92.5: Block 4 — Buyout Gauge (same data as KPI card 4; no new fetch) */}
          <MonitorBuyoutGauge buyoutRatePercent={data.kpi.buyoutRatePercent} />

          {/* Story 92.5: Block 5 — Pipeline Health — independent loading/error state */}
          {pipelineQuery.isLoading && !pipelineQuery.data && (
            <Skeleton className="h-32 w-full" data-testid="monitor-pipeline-skeleton" />
          )}
          {pipelineQuery.isError && !pipelineQuery.data && (
            <div className="rounded-md border border-status-warning/40 bg-status-warning/10 p-4 text-sm text-status-warning flex items-center justify-between">
              <span>Не удалось загрузить состояние пайплайнов.</span>
              <Button variant="ghost" size="sm" onClick={() => void pipelineQuery.refetch()}>
                Повторить
              </Button>
            </div>
          )}
          {pipelineQuery.data && <MonitorPipelineHealth pipelines={pipelineQuery.data.pipelines} />}
        </>
      ) : null}
    </div>
  )
}
