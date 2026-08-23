'use client'

/**
 * ReturnTrendChart — daily return trend with stacked bars + return rate line.
 *
 * Stacked bar chart: cancellations, refusals, defects (left Y-axis, counts).
 * Line overlay: returnRate (right Y-axis, percentage).
 * Consumes useReturnsDailyTrends from the returns-daily API.
 *
 * Story 169.11: grid/axis strokes → semantic tokens (169.4 canon); recoverable
 * error state distinct from valid empty; sr-only data alternative (169.6/169.8).
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { formatPercentage } from '@/lib/utils'
import { useReturnsDailyTrends } from '@/hooks/use-returns-daily'
import {
  RETURNS_BAR_SERIES,
  RETURNS_DAILY_COLORS,
  formatReturnDate,
  formatReturnCount,
} from './returns-daily-trend-config'
import { ReturnTrendTooltip, ReturnTrendLegend } from './ReturnTrendChartTooltip'
// Round-1 review (F5): sr-table extracted to its own owned file.
import { ReturnTrendSrTable } from './ReturnTrendSrTable'
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
  const { data: response, isLoading, isError } = useReturnsDailyTrends(from ?? '', to ?? '')

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

  // Story 169.11: recoverable error is distinct from valid empty below.
  if (isError) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Возвраты по дням</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Не удалось загрузить данные о возвратах по дням</AlertDescription>
          </Alert>
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
              {/* Story 169.11: grid/axis via semantic tokens — BuyoutTrendChart.tsx (169.4) precedent */}
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: 'var(--color-chart-axis)' }}
                axisLine={{ stroke: 'var(--color-border)' }}
                tickLine={{ stroke: 'var(--color-border)' }}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={formatReturnCount}
                tick={{ fontSize: 12, fill: 'var(--color-chart-axis)' }}
                axisLine={{ stroke: 'var(--color-border)' }}
                tickLine={false}
                width={50}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v: number) => formatPercentage(v)}
                tick={{ fontSize: 12, fill: 'var(--color-chart-axis)' }}
                axisLine={{ stroke: 'var(--color-border)' }}
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
              {/* Round-1 review F6: dot-fill var shape per funnel FunnelOverlayPlot.tsx:105 (169.8) */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="returnRate"
                stroke={RETURNS_DAILY_COLORS.returnRate}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 2, fill: 'var(--color-background)' }}
                activeDot={{ r: 5, strokeWidth: 2 }}
                animationDuration={prefersReducedMotion ? 0 : 300}
                animationEasing="ease-in-out"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ResponsiveChartFrame>
        {/* Story 169.11: non-hover data alternative (169.6/169.8 sr-only canon) */}
        <ReturnTrendSrTable daily={response?.daily ?? []} period={response?.period} />
      </CardContent>
    </Card>
  )
}
