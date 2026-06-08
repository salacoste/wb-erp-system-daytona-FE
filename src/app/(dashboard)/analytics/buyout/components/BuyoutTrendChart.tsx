'use client'

/**
 * Buyout Trend Chart — LineChart showing buyout rate over time.
 * Uses funnel time-series data (groupBy=day) which provides buyoutConversion per day.
 * Follows DailyTrendChart / FunnelOverlayChart patterns from the codebase.
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
import { formatPercentage } from '@/lib/formatters'
import type { FunnelDayItem } from '@/types/analytics-funnel'

// -- Config --

const LINE_CONFIG = {
  type: 'monotone' as const,
  strokeWidth: 2,
  dot: { r: 3, strokeWidth: 2, fill: 'white' },
  activeDot: { r: 5, strokeWidth: 2 },
  animationDuration: 300,
  animationEasing: 'ease-in-out' as const,
}

const CHART_COLOR = '#22C55E'

/** Format date as DD.MM for x-axis labels */
function formatDailyDate(date: string): string {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  return `${day}.${month}`
}

/** Format full Russian date for tooltip */
function formatTooltipDate(date: string): string {
  const d = new Date(date)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

// -- Tooltip --

interface TooltipPayloadEntry {
  value: number
  dataKey: string
  color: string
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
}) {
  if (!active || !payload?.length || !label) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
      <p className="mb-1 text-sm text-muted-foreground">{formatTooltipDate(label)}</p>
      <p className="text-sm font-semibold" style={{ color: CHART_COLOR }}>
        Выкуп: {formatPercentage(payload[0].value)}
      </p>
    </div>
  )
}

// -- Component --

interface BuyoutTrendChartProps {
  data: FunnelDayItem[]
  isLoading: boolean
  className?: string
}

export function BuyoutTrendChart({ data, isLoading, className }: BuyoutTrendChartProps) {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

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

  if (!data || data.length === 0) {
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
        {/* Legend */}
        <div className="mb-4 flex items-center gap-2" role="group" aria-label="Легенда графика">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLOR }} />
          <span className="text-sm text-muted-foreground">Процент выкупа</span>
        </div>

        {/* Chart */}
        <div
          role="img"
          aria-label="Линейный график динамики процента выкупа по дням"
          className="h-60 w-full md:h-70 lg:h-80"
        >
          <p className="sr-only">Линейный график показывает процент выкупа за {data.length} дней</p>
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
                tickFormatter={(v: number) => formatPercentage(v)}
                tick={{ fontSize: 12, fill: '#757575' }}
                axisLine={{ stroke: '#EEEEEE' }}
                tickLine={false}
                width={55}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<TrendTooltip />} />
              <Line
                type={LINE_CONFIG.type}
                dataKey="buyoutConversion"
                stroke={CHART_COLOR}
                strokeWidth={LINE_CONFIG.strokeWidth}
                dot={LINE_CONFIG.dot}
                activeDot={LINE_CONFIG.activeDot}
                animationDuration={prefersReducedMotion ? 0 : LINE_CONFIG.animationDuration}
                animationEasing={LINE_CONFIG.animationEasing}
                name="Процент выкупа"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
