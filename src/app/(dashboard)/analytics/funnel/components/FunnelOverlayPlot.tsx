'use client'

import { useMemo } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { OverlayTooltip } from './FunnelOverlayTooltip'
import {
  formatCompactCount,
  formatCompactRub,
  formatOverlayDate,
  OVERLAY_COLORS,
  OVERLAY_SERIES,
  type MergedChartDay,
  type OverlayMetricKey,
} from './funnel-overlay-config'

const FUNNEL_KEYS: OverlayMetricKey[] = ['openCardCount', 'ordersCount', 'buyoutCount']

export function FunnelOverlayPlot({
  data,
  visibleSeries,
  showAdOverlay,
}: {
  data: MergedChartDay[]
  visibleSeries: string[]
  showAdOverlay: boolean
}) {
  const animationDuration = useMemo(() => {
    if (typeof window === 'undefined') return 300
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300
  }, [])

  const axisTick = { fontSize: 12, fill: 'var(--color-chart-axis)' }
  const axisLine = { stroke: 'var(--color-border)' }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 10, bottom: 24, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatOverlayDate}
            tick={axisTick}
            axisLine={axisLine}
            tickLine={axisLine}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={formatCompactCount}
            tick={axisTick}
            axisLine={axisLine}
            tickLine={false}
            width={50}
          />
          {showAdOverlay ? (
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={formatCompactRub}
              tick={axisTick}
              axisLine={axisLine}
              tickLine={false}
              width={60}
            />
          ) : null}
          <Tooltip
            content={<OverlayTooltip visible={visibleSeries} showAdOverlay={showAdOverlay} />}
          />
          {FUNNEL_KEYS.filter(key => visibleSeries.includes(key)).map(key => {
            const series = OVERLAY_SERIES.find(item => item.key === key)
            return (
              <Bar
                key={key}
                yAxisId="left"
                dataKey={key}
                fill={OVERLAY_COLORS[key]}
                fillOpacity={series?.fillOpacity}
                stroke={OVERLAY_COLORS[key]}
                strokeWidth={2}
                strokeDasharray={series?.strokeDasharray}
                radius={[2, 2, 0, 0]}
                maxBarSize={24}
                animationDuration={animationDuration}
              />
            )
          })}
          {showAdOverlay && visibleSeries.includes('adSpend') ? (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="adSpend"
              stroke={OVERLAY_COLORS.adSpend}
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={{ r: 3, strokeWidth: 2, fill: 'var(--color-background)' }}
              activeDot={{ r: 5, strokeWidth: 2 }}
              connectNulls={false}
              animationDuration={animationDuration}
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
