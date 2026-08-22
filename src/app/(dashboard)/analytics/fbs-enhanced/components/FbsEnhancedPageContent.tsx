/**
 * FBS Enhanced Analytics — Page Orchestrator
 * Epic 96-FE Story 96.13: aggregated view from GET /v1/analytics/fbs/enhanced
 *
 * Pattern 1 (CLAUDE.md § Multi-Source Orchestration): single fetch, 5 independent
 * section state machines. A null data-slice for one section does NOT blank others.
 *
 * Date-range default: last 30 days inclusive (matches Story 96.11 + 96.12 + acquiring precedent).
 */

'use client'

import { useState, useMemo } from 'react'
import { format, subDays } from 'date-fns'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { DateRangePickerExtended } from '@/components/custom/DateRangePickerExtended'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useFbsEnhanced } from '@/hooks/use-fbs-enhanced'
import { useDelayedLoadingState } from '@/hooks/useDelayedLoadingState'
import { FbsOrderStatsSection } from './FbsOrderStatsSection'
import { FbsStockAnalyticsSection } from './FbsStockAnalyticsSection'
import { FbsRegionalDataSection } from './FbsRegionalDataSection'
import { FbsCalculatedMetricsSection } from './FbsCalculatedMetricsSection'
import { FbsFunnelSection } from './FbsFunnelSection'
import type { DateRange } from '@/types/date-range'

function getDefaultRange(): DateRange {
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  const from = subDays(to, 29)
  from.setHours(0, 0, 0, 0)
  return { from, to }
}

function formatApi(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function FbsEnhancedPageContent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultRange)

  // M-4 fix: memoize derived API params per Pattern 1 precedent (MonitorPageContent.tsx)
  // TanStack Query shallow-equals queryKey by value, but memoization prevents unnecessary
  // object creation on every render and documents the derived-value pattern explicitly.
  const { apiFrom, apiTo } = useMemo(
    () => ({
      apiFrom: dateRange ? formatApi(dateRange.from) : '',
      apiTo: dateRange ? formatApi(dateRange.to) : '',
    }),
    [dateRange]
  )

  const { data, isLoading, isError, refetch } = useFbsEnhanced(apiFrom, apiTo)

  const hasData = data != null
  const showSkeleton = isLoading && !hasData
  const showSlowLoading = useDelayedLoadingState(showSkeleton)
  const showFullError = isError && !isLoading && !hasData

  return (
    <div className="space-y-6" data-testid="fbs-enhanced-page">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Расширенная аналитика FBS</h1>
        <p className="text-muted-foreground mt-1">Сводный обзор метрик FBS склада</p>
      </div>

      {/* Date range picker — controls all 5 sections (single fetch) */}
      <DateRangePickerExtended
        value={dateRange}
        onChange={setDateRange}
        maxDays={365}
        placeholder="Выберите период"
        id="fbs-enhanced-date-range"
      />

      {/* Page-level state machine */}
      {showSkeleton && !showSlowLoading ? (
        <div className="space-y-4" role="status" aria-busy="true" aria-label="Загрузка данных">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : showSkeleton && showSlowLoading ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Данные FBS загружаются дольше обычного. Можно подождать или повторить запрос.
            </span>
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
      ) : showFullError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Не удалось загрузить данные расширенной аналитики FBS. Попробуйте ещё раз.</span>
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
        <div className="space-y-6">
          {/* Stale-data banner — fetch error with cached data */}
          {isError && (
            <div className="rounded-md border border-status-warning/30 bg-status-warning/15 px-4 py-2 text-sm text-status-warning flex items-center justify-between">
              <span>Не удалось обновить. Показаны кэшированные данные.</span>
              <Button variant="ghost" size="sm" onClick={() => void refetch()}>
                Повторить
              </Button>
            </div>
          )}
          {/* Section 1: Order Stats */}
          <FbsOrderStatsSection orderStats={data.orderStats} />
          {/* Section 2: Stock Analytics */}
          <FbsStockAnalyticsSection stockAnalytics={data.stockAnalytics} />
          {/* Section 3: Regional Data — recharts BarChart */}
          <FbsRegionalDataSection regionalData={data.regionalData} />
          {/* Section 4: Calculated Metrics */}
          <FbsCalculatedMetricsSection calculatedMetrics={data.calculatedMetrics} />
          {/* Section 5: Funnel — raw SVG */}
          <FbsFunnelSection funnelData={data.funnelData} />
        </div>
      ) : null}
    </div>
  )
}
