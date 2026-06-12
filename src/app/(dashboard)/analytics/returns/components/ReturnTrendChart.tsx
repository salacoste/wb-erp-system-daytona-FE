'use client'

/**
 * ReturnTrendChart — daily return trend with stacked bars + return rate line.
 *
 * Stacked bar chart: cancellations, refusals, defects (left Y-axis, counts).
 * Line overlay: returnRate (right Y-axis, percentage).
 * Consumes useReturnsDailyTrends from the returns-daily API.
 */

import { useMemo } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPercentage } from '@/lib/utils'
import { useReturnsDailyTrends } from '@/hooks/use-returns-daily'
import {
  RETURNS_BAR_SERIES,
  RETURNS_DAILY_COLORS,
  formatReturnDate,
  formatReturnCount,
} from './returns-daily-trend-config'
import { ReturnTrendTooltip, ReturnTrendLegend } from './ReturnTrendChartTooltip'
import type { DailyReturnItem } from '@/types/returns-daily'
import { ResponsiveChartFrame } from '@/components/custom/analytics/ResponsiveChartFrame'

// ============================================================================
// Props
// ============================================================================

interface ReturnTrendChartProps {
  from?: string
  to?: string
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function ReturnTrendChart({ from, to, className }: ReturnTrendChartProps) {
  const { data: response, isLoading } = useReturnsDailyTrends(from ?? '', to ?? '')

  const chartData = useMemo(() => {
    if (!response?.daily) return []
    return response.daily.map((item: DailyReturnItem) => ({
      ...item,
      date: formatReturnDate(item.date),
    }))
  }, [response])

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
        <ReturnTrendLegend />
        <ResponsiveChartFrame
          label={`График возвратов по дням: ${chartData.length} дней`}
          className="h-60 md:h-70 lg:h-80"
        >
          <p className="sr-only">
            Комбинированный график показывает возвраты по категориям (столбцы) и долю возвратов
            (линия) за {chartData.length} дней
          </p>
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={1}
            minHeight={1}
            initialDimension={{ width: 1, height: 1 }}
          >
            <ComposedChart data={chartData} margin={{ top: 12, right: 10, bottom: 40, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#757575' }}
                axisLine={{ stroke: '#EEEEEE' }}
                tickLine={{ stroke: '#EEEEEE' }}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={formatReturnCount}
                tick={{ fontSize: 12, fill: '#757575' }}
                axisLine={{ stroke: '#EEEEEE' }}
                tickLine={false}
                width={50}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v: number) => formatPercentage(v)}
                tick={{ fontSize: 12, fill: '#757575' }}
                axisLine={{ stroke: '#EEEEEE' }}
                tickLine={false}
                width={55}
              />
              <Tooltip content={<ReturnTrendTooltip />} />
              <Legend content={() => null} />
              {RETURNS_BAR_SERIES.map(series => (
                <Bar
                  key={series.key}
                  yAxisId="left"
                  dataKey={series.key}
                  stackId="returns"
                  fill={series.color}
                  animationDuration={prefersReducedMotion ? 0 : 300}
                />
              ))}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="returnRate"
                stroke={RETURNS_DAILY_COLORS.returnRate}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 2, fill: 'white' }}
                activeDot={{ r: 5, strokeWidth: 2 }}
                animationDuration={prefersReducedMotion ? 0 : 300}
                animationEasing="ease-in-out"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ResponsiveChartFrame>
      </CardContent>
    </Card>
  )
}
