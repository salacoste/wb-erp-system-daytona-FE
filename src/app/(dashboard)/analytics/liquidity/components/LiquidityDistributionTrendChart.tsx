'use client'

/**
 * LiquidityDistributionTrendChart
 * Story 165.4-FE: Liquidity Trends — secondary distribution visualization.
 *
 * Stacked AreaChart of the 4 distribution percentages (highly_liquid / medium /
 * low / illiquid), summing ≈ 100% per day. Renders ONLY the BE-provided points
 * (AC2 — no synthesized/interpolated days).
 *
 * Consumes the SAME `TrendDataPoint[]` as the main ComposedChart (no flattening)
 * so the shared `<LiquidityTrendTooltip/>` receives the full point (date +
 * frozen_capital + avg_turnover_days + distribution) and does not crash on
 * `point.distribution[key]`. recharts nested dot-path dataKeys
 * (`distribution.highly_liquid_pct`, …) read the nested fields directly.
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ResponsiveChartFrame } from '@/components/custom/analytics/ResponsiveChartFrame'
import { LiquidityTrendTooltip } from './LiquidityTrendTooltip'
import {
  LIQUIDITY_TREND_COLORS,
  DISTRIBUTION_STACK_ORDER,
  formatTrendDate,
} from './liquidity-trend-config'
import type { TrendDataPoint } from '@/types/liquidity'

interface LiquidityDistributionTrendChartProps {
  data: TrendDataPoint[]
  prefersReducedMotion: boolean
}

export function LiquidityDistributionTrendChart({
  data,
  prefersReducedMotion,
}: LiquidityDistributionTrendChartProps) {
  return (
    <ResponsiveChartFrame
      label="График динамики распределения ликвидности по категориям"
      className="h-40 md:h-48"
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <AreaChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
          <XAxis
            dataKey="date"
            tickFormatter={formatTrendDate}
            tick={{ fontSize: 11, fill: '#757575' }}
            axisLine={{ stroke: '#EEEEEE' }}
            tickLine={{ stroke: '#EEEEEE' }}
            minTickGap={24}
          />
          <YAxis
            // locale-percent-allow: recharts axis tick
            tickFormatter={(v: number) => `${Math.round(v)}%`}
            tick={{ fontSize: 11, fill: '#757575' }}
            axisLine={false}
            tickLine={false}
            width={36}
            domain={[0, 100]}
          />
          <Tooltip content={<LiquidityTrendTooltip />} />
          {DISTRIBUTION_STACK_ORDER.map(key => (
            <Area
              key={key}
              type="monotone"
              dataKey={`distribution.${key}`}
              stackId="dist"
              stroke={LIQUIDITY_TREND_COLORS[key]}
              fill={LIQUIDITY_TREND_COLORS[key]}
              fillOpacity={0.35}
              strokeWidth={1}
              animationDuration={prefersReducedMotion ? 0 : 300}
              isAnimationActive={!prefersReducedMotion}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ResponsiveChartFrame>
  )
}
