'use client'

/**
 * ReturnTrendChart — daily return count time-series for Returns Analytics.
 *
 * Single-axis LineChart: returnsCount per day over the selected period.
 * Consumes DailyMetrics[] (returnsCount field from finance daily data).
 * Follows recharts pattern from DailyTrendChart / ProductAdvTrendChart.
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber } from '@/lib/utils'
import { useDailyMetrics } from '@/hooks/useDailyMetrics'
import type { DailyMetrics } from '@/types/daily-metrics'

// ============================================================================
// Props
// ============================================================================

interface ReturnTrendChartProps {
  from?: string
  to?: string
  className?: string
}

// ============================================================================
// Helpers
// ============================================================================

const RETURN_LINE_COLOR = '#E53935'

function formatDay(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${d}.${m}`
}

interface ChartPoint {
  date: string
  returnsCount: number
}

function toChartPoints(metrics: DailyMetrics[]): ChartPoint[] {
  return metrics.map(m => ({
    date: formatDay(m.date),
    returnsCount: m.returnsCount,
  }))
}

// ============================================================================
// Component
// ============================================================================

export function ReturnTrendChart({ from, to, className }: ReturnTrendChartProps) {
  const { data: dailyMetrics, isLoading } = useDailyMetrics(
    { from: from ?? '', to: to ?? '', mode: 'month' },
    { enabled: !!from && !!to }
  )

  const chartData = useMemo(() => (dailyMetrics ? toChartPoints(dailyMetrics) : []), [dailyMetrics])

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Возвраты по дням</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-60 w-full md:h-70 lg:h-80" />
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Возвраты по дням</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Нет данных о возвратах за выбранный период</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Возвраты по дням</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          role="img"
          aria-label={`График возвратов по дням: ${chartData.length} дней`}
          className="h-60 w-full md:h-70 lg:h-80"
        >
          <p className="sr-only">
            Линейный график показывает количество возвратов за {chartData.length} дней
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 10, bottom: 40, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#757575' }}
                axisLine={{ stroke: '#EEEEEE' }}
                tickLine={{ stroke: '#EEEEEE' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#757575' }}
                tickFormatter={(v: number) => formatNumber(v)}
                axisLine={{ stroke: '#EEEEEE' }}
                tickLine={false}
                width={50}
              />
              <Tooltip
                formatter={(value: number) => [formatNumber(value), 'Возвраты']}
                labelFormatter={(label: string) => `Дата: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="returnsCount"
                stroke={RETURN_LINE_COLOR}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 2, fill: 'white' }}
                activeDot={{ r: 5, strokeWidth: 2 }}
                name="Возвраты"
                animationDuration={prefersReducedMotion ? 0 : 300}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
