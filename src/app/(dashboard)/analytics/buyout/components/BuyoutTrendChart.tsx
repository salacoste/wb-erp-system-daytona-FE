'use client'

/**
 * Buyout Trend Chart — Multi-series line chart showing daily buyout metrics.
 *
 * Consumes GET /v1/analytics/buyout/daily via useBuyoutDailyTrends hook.
 * Dual Y-axis: buyout/return rate (left, %) + orders count (right).
 * Follows DailyTrendChart pattern from advertising analytics.
 */

import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatPercentage } from '@/lib/formatters'
import { BuyoutDailyTrendTooltip } from './BuyoutDailyTrendTooltip'
import {
  BUYOUT_TREND_COLORS,
  BUYOUT_TREND_SERIES,
  DEFAULT_BUYOUT_VISIBLE,
  formatDailyDate,
  formatCompactCount,
  type BuyoutTrendMetricKey,
} from './buyout-daily-trend-config'
import { useBuyoutDailyTrends } from '@/hooks/use-buyout-daily'

// ============================================================================
// Line Config
// ============================================================================

const LINE_CONFIG = {
  type: 'monotone' as const,
  strokeWidth: 2,
  dot: { r: 3, strokeWidth: 2, fill: 'white' },
  activeDot: { r: 5, strokeWidth: 2 },
  animationDuration: 300,
  animationEasing: 'ease-in-out' as const,
}

// ============================================================================
// Component
// ============================================================================

interface BuyoutTrendChartProps {
  from: string
  to: string
  className?: string
}

export function BuyoutTrendChart({ from, to, className }: BuyoutTrendChartProps) {
  const [visibleSeries, setVisibleSeries] = useState<string[]>([...DEFAULT_BUYOUT_VISIBLE])
  const { data, isLoading } = useBuyoutDailyTrends(from, to)

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const toggleSeries = (key: string) => {
    setVisibleSeries(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]))
  }

  const daily = data?.daily ?? []

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Динамика выкупа</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-60 w-full md:h-70 lg:h-80" />
        </CardContent>
      </Card>
    )
  }

  if (daily.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Динамика выкупа</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Нет ежедневных данных за выбранный период</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Динамика выкупа</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Legend toggles */}
        <div className="mb-4 flex flex-wrap gap-3" role="group" aria-label="Переключатели метрик">
          {BUYOUT_TREND_SERIES.map(series => {
            const isVisible = visibleSeries.includes(series.key)
            return (
              <button
                key={series.key}
                onClick={() => toggleSeries(series.key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-opacity',
                  isVisible ? 'opacity-100' : 'opacity-40'
                )}
                aria-pressed={isVisible}
                aria-label={`${isVisible ? 'Скрыть' : 'Показать'} ${series.label}`}
              >
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: series.color }} />
                <span>{series.label}</span>
              </button>
            )
          })}
        </div>

        {/* Chart */}
        <div
          role="img"
          aria-label="График ежедневной динамики выкупа"
          className="h-60 w-full md:h-70 lg:h-80"
        >
          <p className="sr-only">
            Линейный график показывает {visibleSeries.length} метрик за {daily.length} дней
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily} margin={{ top: 12, right: 10, bottom: 40, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDailyDate}
                tick={{ fontSize: 12, fill: '#757575' }}
                axisLine={{ stroke: '#EEEEEE' }}
                tickLine={{ stroke: '#EEEEEE' }}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={(v: number) => formatPercentage(v)}
                tick={{ fontSize: 12, fill: '#757575' }}
                axisLine={{ stroke: '#EEEEEE' }}
                tickLine={false}
                width={55}
                domain={['auto', 'auto']}
                label={{
                  value: '%',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 11, fill: '#757575' },
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={formatCompactCount}
                tick={{ fontSize: 12, fill: '#757575' }}
                axisLine={{ stroke: '#EEEEEE' }}
                tickLine={false}
                width={55}
              />
              <Tooltip content={<BuyoutDailyTrendTooltip visibleSeries={visibleSeries} />} />
              {BUYOUT_TREND_SERIES.filter(s => visibleSeries.includes(s.key)).map(series => (
                <Line
                  key={series.key}
                  yAxisId={series.axis}
                  type={LINE_CONFIG.type}
                  dataKey={series.key}
                  stroke={BUYOUT_TREND_COLORS[series.key as BuyoutTrendMetricKey]}
                  strokeWidth={LINE_CONFIG.strokeWidth}
                  dot={LINE_CONFIG.dot}
                  activeDot={LINE_CONFIG.activeDot}
                  animationDuration={prefersReducedMotion ? 0 : LINE_CONFIG.animationDuration}
                  animationEasing={LINE_CONFIG.animationEasing}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
