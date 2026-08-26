'use client'

/**
 * Weekday Patterns Chart Component
 * Story 63.8-FE: Orders Seasonal Patterns Analysis
 * Epic 63 - Dashboard Enhancements (Orders Analytics)
 *
 * Bar chart showing weekday order volume patterns.
 * Highlights peak day and shows weekend styling.
 *
 * @see docs/stories/epic-63/story-63.8-fe-orders-seasonal-patterns.md
 */

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { localizeWeekdayShort, SEASONAL_COLORS } from '@/lib/seasonal-localization'
import type { WeekdayPattern } from '@/types/orders-volume'
import { PatternTooltip } from './PatternTooltip'

export interface WeekdayPatternsChartProps {
  /** Weekday pattern data */
  data: WeekdayPattern[]
  /** Peak day name for highlighting */
  peakDay: string
  /** Chart height in pixels */
  height?: number
}

// Weekday order starting from Monday (Russian convention)
const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Weekend days for different styling
const WEEKEND_DAYS = ['Saturday', 'Sunday']

/**
 * Bar chart showing weekday order volume with peak highlighting
 */
export function WeekdayPatternsChart({ data, peakDay, height = 250 }: WeekdayPatternsChartProps) {
  // Sort and transform data
  const chartData = useMemo(() => {
    return [...data]
      .sort((a, b) => WEEKDAY_ORDER.indexOf(a.dayOfWeek) - WEEKDAY_ORDER.indexOf(b.dayOfWeek))
      .map(item => {
        // Peak day gets the highlight tone; weekends use a softened categorical
        // tone derived from the series token (color-mix idiom, liquidity
        // components precedent: LiquidityDistributionCards/LiquidityTableRowCells)
        const isWeekend = WEEKEND_DAYS.includes(item.dayOfWeek)
        let fill: string

        if (item.dayOfWeek === peakDay) {
          fill = SEASONAL_COLORS.bar.peak
        } else if (isWeekend) {
          fill = 'color-mix(in srgb, var(--color-chart-1) 60%, transparent)'
        } else {
          fill = SEASONAL_COLORS.bar.default
        }

        return {
          ...item,
          dayRu: localizeWeekdayShort(item.dayOfWeek),
          fill,
          isWeekend,
        }
      })
  }, [data, peakDay])

  return (
    <div>
      <h4 className="text-sm font-medium text-foreground mb-2">Распределение по дням</h4>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <XAxis dataKey="dayRu" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
          <Tooltip content={<PatternTooltip type="weekday" />} />
          <Bar dataKey="avgOrders" radius={[4, 4, 0, 0]} maxBarSize={50}>
            {chartData.map(entry => (
              <Cell key={entry.dayOfWeek} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
