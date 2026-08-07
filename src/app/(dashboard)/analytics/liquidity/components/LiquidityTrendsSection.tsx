'use client'

/**
 * LiquidityTrendsSection
 * Story 165.4-FE: Liquidity Trends (Динамика ликвидности)
 *
 * Orchestrator section wired into the liquidity page between Benchmarks and
 * Table. Owns its OWN loading/empty/error state machine (AC4 — multi-source
 * orchestration): a trends failure never blanks the surrounding page.
 *
 * State machine: loading → error → empty → populated.
 * - A malformed response THROWS in getLiquidityTrends (boundary guard) →
 *   TanStack `isError` → the error branch. There is no separate malformed
 *   branch: the normalizer would otherwise mask a genuine backend failure.
 * - A well-formed empty response (`{meta, trends:[]}`) → empty branch.
 *
 * AC2: forwards ONLY the BE-provided trend points to the chart.
 */

import { useState, useCallback } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useLiquidityTrends } from '@/hooks/useLiquidity'
import { LiquidityTrendChart } from './LiquidityTrendChart'
import { PERIOD_PRESETS, DEFAULT_PERIOD, type LiquidityTrendPeriod } from './liquidity-trend-config'
import type { TrendDataPoint } from '@/types/liquidity'

/** Canonical RU error string for the trends error/retry branch (Story 165.4 M4). */
const TRENDS_ERROR_MESSAGE = 'Не удалось загрузить динамику ликвидности. Попробуйте ещё раз.'

export function LiquidityTrendsSection() {
  const [period, setPeriod] = useState<LiquidityTrendPeriod>(DEFAULT_PERIOD)

  const { data, isLoading, isError, refetch } = useLiquidityTrends(
    { period },
    { staleTime: 1_800_000 } // 30 min — historical data changes slowly
  )

  const handleRetry = useCallback(() => {
    refetch()
  }, [refetch])

  const trends: TrendDataPoint[] = data?.trends ?? []
  const hasData = trends.length > 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Динамика ликвидности</CardTitle>
          {/* Period selector */}
          <div className="flex items-center gap-1" role="group" aria-label="Период динамики">
            {PERIOD_PRESETS.map(p => (
              <Button
                key={p}
                type="button"
                size="sm"
                variant={p === period ? 'default' : 'outline'}
                aria-pressed={p === period}
                onClick={() => setPeriod(p)}
                className="h-7 px-2.5 text-xs"
              >
                {p} дн.
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <LiquidityTrendsBody
          isLoading={isLoading}
          isError={isError}
          hasData={hasData}
          trends={trends}
          onRetry={handleRetry}
        />
      </CardContent>
    </Card>
  )
}

interface LiquidityTrendsBodyProps {
  isLoading: boolean
  isError: boolean
  hasData: boolean
  trends: TrendDataPoint[]
  onRetry: () => void
}

function LiquidityTrendsBody({
  isLoading,
  isError,
  hasData,
  trends,
  onRetry,
}: LiquidityTrendsBodyProps) {
  // Loading — independent skeleton scoped to this section.
  if (isLoading) {
    return <Skeleton className="h-72 w-full md:h-80" />
  }

  // Error OR malformed response (malformed throws in getLiquidityTrends → isError)
  // → canonical error + retry control (RU). Page rest stays usable (AC4).
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{TRENDS_ERROR_MESSAGE}</span>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Повторить
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Empty — BE returned trends:[] (no snapshots collected yet). No synthesized points.
  if (!hasData) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">
          Исторические снимки ликвидности пока не собраны
        </p>
      </div>
    )
  }

  // Populated — render ONLY the BE-provided points (AC2).
  return <LiquidityTrendChart data={trends} className="border-0 shadow-none" hideHeader />
}
