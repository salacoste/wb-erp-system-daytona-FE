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
import type { DailyMetrics } from '@/types/daily-metrics'

// ============================================================================
// Component Props
// ============================================================================

interface DailyBreakdownChartProps {
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

// ============================================================================
// Chart Configuration
// ============================================================================

const LINE_CONFIG = {
  type: 'monotone' as const,
  strokeWidth: 2,
  dot: { r: 4, strokeWidth: 2, fill: 'white' },
  activeDot: { r: 6, strokeWidth: 2 },
  animationDuration: 300,
  animationEasing: 'ease-in-out' as const,
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Daily breakdown line chart with 8 metric series
 *
 * @example
 * <DailyBreakdownChart
 *   data={dailyMetrics}
 *   periodType="week"
 *   visibleSeries={['orders', 'sales', 'profit']}
 *   isLoading={isLoading}
 * />
 */
export function DailyBreakdownChart({
  data,
  periodType,
  visibleSeries,
  isLoading,
  error,
  className,
}: DailyBreakdownChartProps) {
  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // Memoize chart data transformation
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    return data.map(item => ({
      ...item,
      // Map theoreticalProfit to profit for chart
      profit: item.theoreticalProfit,
    }))
  }, [data])

  // Loading state
  if (isLoading) {
    return <ChartLoadingSkeleton className={className} />
  }

  // Error state
  if (error) {
    return <ChartErrorState error={error} className={className} />
  }

  // Empty state
  if (!chartData || chartData.length === 0) {
    return <ChartEmptyState className={className} />
  }

  // Check for partial data
  const expectedDays = periodType === 'week' ? 7 : 28
  const hasPartialData = chartData.length < expectedDays

  return (
    <div className={cn('w-full', className)}>
      {hasPartialData && (
        <ChartPartialDataWarning actualDays={chartData.length} expectedDays={expectedDays} />
      )}

      {/* Chart container with accessibility */}
      <div
        role="img"
        aria-label={`График детализации по дням за ${periodType === 'week' ? 'неделю' : 'месяц'}`}
        aria-describedby="chart-description"
        className="h-60 w-full md:h-70 lg:h-80"
      >
        <p id="chart-description" className="sr-only">
          Линейный график показывает {visibleSeries.length} метрик за {chartData.length} дней
        </p>
        <ResponsiveContainer width="100%" height="100%">
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
              width={50}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={formatCompactCurrency}
              tick={{ fontSize: 12, fill: '#757575' }}
              axisLine={{ stroke: '#EEEEEE' }}
              tickLine={false}
              width={50}
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
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ============================================================================
// Exports
// ============================================================================

export type { DailyBreakdownChartProps }
