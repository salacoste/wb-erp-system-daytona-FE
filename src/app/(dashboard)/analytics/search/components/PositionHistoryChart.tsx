'use client'

/**
 * PositionHistoryChart — daily search position history for a single SKU.
 * LineChart with inverted Y-axis (lower position = better).
 * Uses recharts following DailyTrendChart patterns.
 *
 * Helpers and shell extracted for 200-line ESLint cap compliance:
 *  - position-history-helpers.tsx: toChartData, computeYDomain, formatChartDate, tooltip
 *  - ChartShell.tsx: shared card wrapper
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
import { usePositionHistory } from '@/hooks/use-search-position-trends'
import {
  GRID_STROKE,
  LINE_COLOR,
  TICK_FILL,
  toChartData,
  computeYDomain,
  formatChartDate,
  PositionTooltipContent,
} from './position-history-helpers'
import { ChartShell } from './ChartShell'

interface PositionHistoryChartProps {
  nmId: number | null
  className?: string
}

export function PositionHistoryChart({ nmId, className }: PositionHistoryChartProps) {
  const { data, isLoading } = usePositionHistory(nmId ?? undefined)
  const chartData = useMemo(() => toChartData(data?.history ?? []), [data?.history])
  const yDomain = useMemo(() => computeYDomain(chartData), [chartData])

  const title = nmId ? `История позиций — ${String(nmId)}` : 'История позиций'

  if (!nmId) {
    return (
      <ChartShell title={title} className={className}>
        <p className="flex items-center justify-center py-12 text-muted-foreground">
          Выберите SKU из таблицы для просмотра истории
        </p>
      </ChartShell>
    )
  }

  if (isLoading) {
    return (
      <ChartShell title={title} className={className}>
        <Skeleton className="h-60 w-full md:h-70 lg:h-80" />
      </ChartShell>
    )
  }

  if (chartData.length === 0) {
    return (
      <ChartShell title={title} className={className}>
        <p className="flex items-center justify-center py-12 text-muted-foreground">
          Нет данных по позициям для данного SKU
        </p>
      </ChartShell>
    )
  }

  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          role="img"
          aria-label={`График истории позиций SKU ${String(nmId)} за ${chartData.length} дней`}
          className="h-60 w-full md:h-70 lg:h-80"
        >
          <p className="sr-only">
            Линейный график показывает среднюю позицию за {chartData.length} дней
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 10, bottom: 40, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="date"
                tickFormatter={formatChartDate}
                tick={{ fontSize: 12, fill: TICK_FILL }}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={{ stroke: GRID_STROKE }}
              />
              <YAxis
                reversed
                domain={yDomain}
                width={45}
                tick={{ fontSize: 12, fill: TICK_FILL }}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
                label={{
                  value: 'Позиция',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 11, fill: TICK_FILL },
                }}
              />
              <Tooltip content={<PositionTooltipContent />} />
              <Line
                type="monotone"
                dataKey="avgPosition"
                stroke={LINE_COLOR}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 2, fill: 'white' }}
                activeDot={{ r: 5, strokeWidth: 2 }}
                animationDuration={reducedMotion ? 0 : 300}
                animationEasing="ease-in-out"
                name="Позиция"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
