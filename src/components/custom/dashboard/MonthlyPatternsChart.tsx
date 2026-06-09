'use client'

/**
 * Monthly Patterns Chart Component
 * Story 63.8-FE: Orders Seasonal Patterns Analysis
 * Epic 63 - Dashboard Enhancements (Orders Analytics)
 *
 * Bar chart showing monthly order volume patterns.
 * Highlights peak and low months with color coding.
 *
 * @see docs/stories/epic-63/story-63.8-fe-orders-seasonal-patterns.md
 */

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { localizeMonthShort, getBarColor } from '@/lib/seasonal-localization'
import type { MonthlyPattern } from '@/types/orders-volume'
import { PatternTooltip } from './PatternTooltip'

export interface MonthlyPatternsChartProps {
  /** Monthly pattern data */
  data: MonthlyPattern[]
  /** Peak month name for highlighting */
  peakMonth: string
  /** Low month name for highlighting */
  lowMonth: string
  /** Chart height in pixels */
  height?: number
}

// Month order for chronological sorting
const MONTH_ORDER = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/**
 * Bar chart showing monthly order volume with peak/low highlighting
 */
export function MonthlyPatternsChart({
  data,
  peakMonth,
  lowMonth,
  height = 250,
}: MonthlyPatternsChartProps) {
  // Sort and transform data
  const chartData = useMemo(() => {
    return [...data]
      .sort((a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month))
      .map(item => ({
        ...item,
        monthRu: localizeMonthShort(item.month),
        fill: getBarColor(item.month, peakMonth, lowMonth),
      }))
  }, [data, peakMonth, lowMonth])

  // Format Y-axis as "Xk"
  const formatYAxis = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
    return value.toString()
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">Распределение по месяцам</h4>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <XAxis dataKey="monthRu" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={35}
          />
          <Tooltip content={<PatternTooltip type="monthly" />} />
          <Bar dataKey="avgOrders" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {chartData.map(entry => (
              <Cell key={entry.month} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
