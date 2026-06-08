'use client'

/**
 * PositionHistoryChart — daily search position history for a single SKU.
 * LineChart with inverted Y-axis (lower position = better).
 * Uses recharts following DailyTrendChart patterns.
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
import { formatDate } from '@/lib/utils'
import type { PositionHistoryPoint } from '@/types/search-position-trends'

interface PositionHistoryChartProps {
  nmId: number | null
  className?: string
}

const LINE_COLOR = '#3B82F6'
const GRID_STROKE = '#EEEEEE'
const TICK_FILL = '#757575'

interface ChartDatum {
  date: string
  avgPosition: number
  impressions: number
  clicks: number
}

function PositionTooltipContent({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: ChartDatum }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-md border bg-white px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{formatDate(d.date)}</p>
      <p>
        Позиция: <span className="font-semibold">{d.avgPosition.toFixed(1)}</span>
      </p>
      <p className="text-muted-foreground">
        Показы: {d.impressions} · Клики: {d.clicks}
      </p>
    </div>
  )
}

function formatChartDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`
}

function toChartData(history: PositionHistoryPoint[]): ChartDatum[] {
  return history.map(p => ({
    date: p.date,
    avgPosition: p.avgPosition,
    impressions: p.impressions,
    clicks: p.clicks,
  }))
}

function computeYDomain(data: ChartDatum[]): [number, number] {
  if (data.length === 0) return [1, 100]
  const positions = data.map(d => d.avgPosition).filter(v => v > 0)
  if (positions.length === 0) return [1, 100]
  const yMax = Math.ceil(Math.max(...positions) / 5) * 5 + 5
  const yMin = Math.max(1, Math.floor(Math.min(...positions) / 5) * 5 - 5)
  return [yMin, yMax]
}

/** Shared card shell for loading / empty / no-selection states. */
function ChartShell({
  title,
  className,
  children,
}: {
  title: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
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
