'use client'

/**
 * DailyTrendChart Component
 * Story 72.3-FE: Advertising Daily Trend Charts
 *
 * Multi-series line chart for daily advertising metrics:
 * spend (left Y-axis, currency), views/clicks/orders (right Y-axis, counts).
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
import { DailyTrendTooltip } from './DailyTrendTooltip'
import { DailyTrendLegend } from './DailyTrendLegend'
import { DailyTrendSrTable } from './DailyTrendSrTable'
import { ResponsiveChartFrame } from '@/components/custom/analytics/ResponsiveChartFrame'
import {
  DAILY_TREND_COLORS,
  DAILY_TREND_SERIES,
  DEFAULT_DAILY_VISIBLE,
  formatDailyDate,
  formatCompactRub,
  formatCompactCount,
} from './daily-trend-config'
import type { AdvertisingDailyItem } from '@/types/advertising-analytics'

interface DailyTrendChartProps {
  data: AdvertisingDailyItem[]
  isLoading: boolean
  className?: string
}

const LINE_CONFIG = {
  type: 'monotone' as const,
  strokeWidth: 2,
  dot: { r: 3, strokeWidth: 2, fill: 'white' },
  activeDot: { r: 5, strokeWidth: 2 },
  animationDuration: 300,
  animationEasing: 'ease-in-out' as const,
}

export function DailyTrendChart({ data, isLoading, className }: DailyTrendChartProps) {
  const [visibleSeries, setVisibleSeries] = useState<string[]>([...DEFAULT_DAILY_VISIBLE])

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const toggleSeries = (key: string) => {
    setVisibleSeries(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]))
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Динамика по дням</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-60 w-full md:h-70 lg:h-80" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Динамика по дням</CardTitle>
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
        <CardTitle className="text-lg font-semibold">Динамика по дням</CardTitle>
      </CardHeader>
      <CardContent>
        <DailyTrendLegend visibleSeries={visibleSeries} onToggle={toggleSeries} />
        <ResponsiveChartFrame
          label="График ежедневной динамики рекламных метрик"
          className="h-60 md:h-70 lg:h-80"
        >
          <p className="sr-only">
            Линейный график показывает {visibleSeries.length} метрик за {data.length} дней
          </p>
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={1}
            minHeight={1}
            initialDimension={{ width: 1, height: 1 }}
          >
            <LineChart data={data} margin={{ top: 12, right: 10, bottom: 40, left: 40 }}>
              {/* Story 170.1: grid/axis hex → border/chart-axis tokens (169.4 canon) */}
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDailyDate}
                tick={{ fontSize: 12, fill: 'var(--color-chart-axis)' }}
                axisLine={{ stroke: 'var(--color-border)' }}
                tickLine={{ stroke: 'var(--color-border)' }}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={formatCompactRub}
                tick={{ fontSize: 12, fill: 'var(--color-chart-axis)' }}
                axisLine={{ stroke: 'var(--color-border)' }}
                tickLine={false}
                width={55}
                label={{
                  value: '₽',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 11, fill: 'var(--color-chart-axis)' },
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={formatCompactCount}
                tick={{ fontSize: 12, fill: 'var(--color-chart-axis)' }}
                axisLine={{ stroke: 'var(--color-border)' }}
                tickLine={false}
                width={55}
              />
              <Tooltip content={<DailyTrendTooltip visibleSeries={visibleSeries} />} />
              {DAILY_TREND_SERIES.filter(s => visibleSeries.includes(s.key)).map(series => (
                <Line
                  key={series.key}
                  yAxisId={series.axis}
                  type={LINE_CONFIG.type}
                  dataKey={series.key}
                  stroke={DAILY_TREND_COLORS[series.key]}
                  strokeWidth={LINE_CONFIG.strokeWidth}
                  dot={LINE_CONFIG.dot}
                  activeDot={LINE_CONFIG.activeDot}
                  animationDuration={prefersReducedMotion ? 0 : LINE_CONFIG.animationDuration}
                  animationEasing={LINE_CONFIG.animationEasing}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ResponsiveChartFrame>
        {/* Story 170.1: non-hover data alternative (169.11 sr-only canon) */}
        <DailyTrendSrTable data={data} visibleSeries={visibleSeries} />
      </CardContent>
    </Card>
  )
}
