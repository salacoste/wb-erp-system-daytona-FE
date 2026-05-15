'use client'

/**
 * DailyBreakdownChart Component
 * Story 62.6-FE: Daily Breakdown Chart Component
 *
 * Multi-series line chart displaying 8 metrics broken down by day.
 * Features dual Y-axis, responsive design, and interactive legend.
 *
 * @see docs/stories/epic-62/story-62.6-fe-daily-breakdown-chart.md
 */

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'
import { DailyBreakdownTooltip } from './DailyBreakdownTooltip'
import {
  ChartLoadingSkeleton,
  ChartErrorState,
  ChartEmptyState,
  ChartPartialDataWarning,
} from './DailyBreakdownChartStates'
import {
  CHART_COLORS,
  METRIC_SERIES,
  formatDayLabel,
  formatCompactCurrency,
  type MetricKey,
} from './chart-config'
import { LINE_CONFIG } from './daily-chart-config'
import type { DailyMetrics } from '@/types/daily-metrics'

export interface DailyBreakdownChartProps {
  /** Daily metrics data array */
  data: DailyMetrics[]
  /** Period type for X-axis labels */
  periodType: 'week' | 'month'
  /** Array of visible series keys */
  visibleSeries: string[]
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error?: Error | null
  /** Additional class names */
  className?: string
}

export function DailyBreakdownChart({
  data,
  periodType,
  visibleSeries,
  isLoading,
  error,
  className,
}: DailyBreakdownChartProps) {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    return data.map(item => ({
      ...item,
      profit: item.theoreticalProfit,
    }))
  }, [data])

  if (isLoading) return <ChartLoadingSkeleton className={className} />
  if (error) return <ChartErrorState error={error} className={className} />
  if (!chartData || chartData.length === 0) return <ChartEmptyState className={className} />

  const expectedDays = periodType === 'week' ? 7 : 28
  const hasPartialData = chartData.length < expectedDays

  return (
    <div className={cn('w-full', className)}>
      {hasPartialData && (
        <ChartPartialDataWarning actualDays={chartData.length} expectedDays={expectedDays} />
      )}
      <div
        role="img"
        aria-label={`График детализации по дням за ${periodType === 'week' ? 'неделю' : 'месяц'}`}
        aria-describedby="chart-description"
        className="h-60 w-full md:h-70 lg:h-80"
      >
        <p id="chart-description" className="sr-only">
          Линейный график показывает {visibleSeries.length} метрик за {chartData.length} дней
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 12, right: 10, bottom: 40, left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
            <XAxis
              dataKey="date"
              tickFormatter={date => formatDayLabel(date, periodType)}
              tick={{ fontSize: 12, fill: '#757575' }}
              axisLine={{ stroke: '#EEEEEE' }}
              tickLine={{ stroke: '#EEEEEE' }}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={formatCompactCurrency}
              tick={{ fontSize: 12, fill: '#757575' }}
              axisLine={{ stroke: '#EEEEEE' }}
              tickLine={false}
              width={55}
              label={{
                value: '₽',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 11, fill: '#757575' },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={formatCompactCurrency}
              tick={{ fontSize: 12, fill: '#757575' }}
              axisLine={{ stroke: '#EEEEEE' }}
              tickLine={false}
              width={55}
              label={{
                value: '₽',
                angle: 90,
                position: 'insideRight',
                style: { fontSize: 11, fill: '#757575' },
              }}
            />
            <Tooltip content={<DailyBreakdownTooltip visibleSeries={visibleSeries} />} />
            {METRIC_SERIES.filter(s => visibleSeries.includes(s.key)).map(series => (
              <Line
                key={series.key}
                yAxisId={series.axis}
                type={LINE_CONFIG.type}
                dataKey={series.key}
                stroke={CHART_COLORS[series.key as MetricKey]}
                strokeWidth={LINE_CONFIG.strokeWidth}
                dot={LINE_CONFIG.dot}
                activeDot={LINE_CONFIG.activeDot}
                animationDuration={prefersReducedMotion ? 0 : LINE_CONFIG.animationDuration}
                animationEasing={LINE_CONFIG.animationEasing}
                // Story 106.1-FE: profit may be null for gap-filled days (unknown COGS).
                // connectNulls draws through missing days — avoids jarring line breaks in 7-day chart.
                connectNulls={series.key === 'profit'}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
