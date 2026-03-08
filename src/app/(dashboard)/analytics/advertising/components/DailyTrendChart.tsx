'use client'

/**
 * DailyTrendChart Component
 * Story 72.3-FE: Advertising Daily Trend Charts
 *
 * Multi-series line chart for daily advertising metrics:
 * spend (left Y-axis, currency), views/clicks/orders (right Y-axis, counts).
 * Features toggleable legend, responsive design, and WCAG accessibility.
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
import { DailyTrendTooltip } from './DailyTrendTooltip'
import {
  DAILY_TREND_COLORS,
  DAILY_TREND_SERIES,
  DEFAULT_DAILY_VISIBLE,
  formatDailyDate,
  formatCompactRub,
  formatCompactCount,
  type DailyTrendMetricKey,
} from './daily-trend-config'
import type { AdvertisingDailyItem } from '@/types/advertising-analytics'

// ============================================================================
// Props
// ============================================================================

interface DailyTrendChartProps {
  data: AdvertisingDailyItem[]
  isLoading: boolean
  className?: string
}

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
        {/* Legend toggles */}
        <div className="mb-4 flex flex-wrap gap-3" role="group" aria-label="Переключатели метрик">
          {DAILY_TREND_SERIES.map(series => {
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
          aria-label="График ежедневной динамики рекламных метрик"
          className="h-60 w-full md:h-70 lg:h-80"
        >
          <p className="sr-only">
            Линейный график показывает {visibleSeries.length} метрик за {data.length} дней
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 10, bottom: 40, left: 40 }}>
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
                tickFormatter={formatCompactRub}
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
                tickFormatter={formatCompactCount}
                tick={{ fontSize: 12, fill: '#757575' }}
                axisLine={{ stroke: '#EEEEEE' }}
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
                  stroke={DAILY_TREND_COLORS[series.key as DailyTrendMetricKey]}
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
