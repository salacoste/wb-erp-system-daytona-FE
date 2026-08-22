'use client'

/**
 * LiquidityTrendChart
 * Story 165.4-FE: Liquidity Trends (Динамика ликвидности)
 *
 * Dual-axis ComposedChart: frozen_capital (₽, left) + avg_turnover_days
 * (days, right), with a secondary stacked AreaChart for the 4 distribution
 * percentages beneath. Card shell mirrors LiquidityDistributionChart.
 *
 * AC2: renders ONLY the BE-provided trend points — no client-side fill or
 * interpolation of missing dates. Zero-value days (frozen_capital=0) render
 * as a real 0.
 */

import { useMemo } from 'react'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveChartFrame } from '@/components/custom/analytics/ResponsiveChartFrame'
import { LiquidityTrendTooltip } from './LiquidityTrendTooltip'
import { LiquidityDistributionTrendChart } from './LiquidityDistributionTrendChart'
import {
  LIQUIDITY_TREND_COLORS,
  LIQUIDITY_TREND_LABELS,
  formatTrendDate,
  formatTrendAxisRub,
  formatTrendAxisDays,
} from './liquidity-trend-config'
import { formatCurrency } from '@/lib/utils'
import type { TrendDataPoint } from '@/types/liquidity'

interface LiquidityTrendChartProps {
  /** BE-provided trend points; rendered verbatim (AC2). */
  data: TrendDataPoint[]
  className?: string
  /** Suppress the Card header (title) when embedded in a section that owns it. */
  hideHeader?: boolean
}

function usePrefersReducedMotion(): boolean {
  return useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])
}

/** sr-only summary table so screen readers get the raw numbers. */
function TrendSrSummary({ data }: { data: TrendDataPoint[] }) {
  return (
    <table className="sr-only">
      <caption>Динамика ликвидности по дням</caption>
      <thead>
        <tr>
          <th scope="col">Дата</th>
          <th scope="col">Замороженный капитал</th>
          <th scope="col">Средний оборот, дней</th>
        </tr>
      </thead>
      <tbody>
        {data.map(p => (
          <tr key={p.date}>
            <th scope="row">{p.date}</th>
            <td>{formatCurrency(p.frozen_capital)}</td>
            <td>{Math.round(p.avg_turnover_days)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function LiquidityTrendChart({ data, className, hideHeader }: LiquidityTrendChartProps) {
  const prefersReducedMotion = usePrefersReducedMotion()

  // Design-system axis/grid tokens (Story 169.10; funnel FunnelOverlayPlot canon).
  const axisTick = { fontSize: 12, fill: 'var(--color-chart-axis)' }
  const axisLine = { stroke: 'var(--color-border)' }

  return (
    <Card className={className}>
      {hideHeader ? null : (
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Динамика ликвидности</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: LIQUIDITY_TREND_COLORS.frozen_capital }}
            />
            {LIQUIDITY_TREND_LABELS.frozen_capital}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: LIQUIDITY_TREND_COLORS.avg_turnover_days }}
            />
            {LIQUIDITY_TREND_LABELS.avg_turnover_days}
          </span>
        </div>

        <ResponsiveChartFrame
          label="График динамики замороженного капитала и среднего оборота"
          className="h-56 md:h-64"
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <ComposedChart data={data} margin={{ top: 12, right: 10, bottom: 40, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="date"
                tickFormatter={formatTrendDate}
                tick={axisTick}
                axisLine={axisLine}
                tickLine={axisLine}
                minTickGap={24}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={formatTrendAxisRub}
                tick={axisTick}
                axisLine={axisLine}
                tickLine={false}
                width={55}
                label={{
                  value: '₽',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 11, fill: 'var(--color-chart-axis)' },
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={formatTrendAxisDays}
                tick={axisTick}
                axisLine={axisLine}
                tickLine={false}
                width={44}
                label={{
                  value: 'дн.',
                  angle: 90,
                  position: 'insideRight',
                  style: { fontSize: 11, fill: 'var(--color-chart-axis)' },
                }}
              />
              <Tooltip content={<LiquidityTrendTooltip />} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="frozen_capital"
                stroke={LIQUIDITY_TREND_COLORS.frozen_capital}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                animationDuration={prefersReducedMotion ? 0 : 300}
                isAnimationActive={!prefersReducedMotion}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avg_turnover_days"
                stroke={LIQUIDITY_TREND_COLORS.avg_turnover_days}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                animationDuration={prefersReducedMotion ? 0 : 300}
                isAnimationActive={!prefersReducedMotion}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ResponsiveChartFrame>

        {/* Secondary: distribution percentages stacked area */}
        <LiquidityDistributionTrendChart data={data} prefersReducedMotion={prefersReducedMotion} />

        <TrendSrSummary data={data} />
      </CardContent>
    </Card>
  )
}
