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
        // Peak day gets green, weekends get slightly different shade if not peak
        const isWeekend = WEEKEND_DAYS.includes(item.dayOfWeek)
        let fill: string

        if (item.dayOfWeek === peakDay) {
          fill = SEASONAL_COLORS.bar.peak
        } else if (isWeekend) {
          fill = '#60A5FA' // Lighter blue for weekends
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
      <h4 className="text-sm font-medium text-gray-700 mb-2">Распределение по дням</h4>
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
