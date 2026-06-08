'use client'

/**
 * ProductOrganicChart — stacked bar chart for organic vs ad-attributed cart adds.
 * Rendered inside OrganicTab above the correlation table.
 */

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import { formatNumber } from '@/lib/utils'
import type { CorrelationDayItem } from '@/types/unified-product'

interface ProductOrganicChartProps {
  correlation: CorrelationDayItem[]
}

interface ChartRow {
  date: string
  organicCart: number
  estimatedAdCart: number
}

const COLOR_ORGANIC = '#22C55E'
const COLOR_AD = '#3B82F6'

/** Format X-axis date labels: "MM.DD" from ISO date string. */
function formatShortDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export function ProductOrganicChart({ correlation }: ProductOrganicChartProps) {
  const data = useMemo<ChartRow[]>(
    () =>
      correlation.map(d => ({
        date: d.date,
        organicCart: d.organicCart,
        // eslint-disable-next-line no-restricted-syntax -- AGGREGATION-REDUCE: chart treats null as 0 for stacking
        estimatedAdCart: d.estimatedAdCart ?? 0,
      })),
    [correlation]
  )

  if (data.length === 0) return null

  return (
    <div
      role="img"
      aria-label="Столбчатая диаграмма: органические и рекламные добавления в корзину по дням"
      className="h-64 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatShortDate}
            tick={{ fontSize: 11, fill: '#757575' }}
            tickLine={false}
            axisLine={{ stroke: '#EEEEEE' }}
          />
          <YAxis
            tickFormatter={(v: number) => formatNumber(v)}
            tick={{ fontSize: 11, fill: '#757575' }}
            tickLine={false}
            axisLine={{ stroke: '#EEEEEE' }}
            width={48}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatNumber(value),
              name === 'organicCart' ? 'Орг. корзина' : 'Рекл. корзина',
            ]}
            labelFormatter={(label: string) => label}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend
            formatter={(value: string) =>
              value === 'organicCart' ? 'Орг. корзина' : 'Рекл. корзина'
            }
          />
          <Bar
            dataKey="organicCart"
            name="organicCart"
            stackId="cart"
            fill={COLOR_ORGANIC}
            radius={[0, 0, 0, 0]}
            maxBarSize={36}
            animationDuration={300}
          />
          <Bar
            dataKey="estimatedAdCart"
            name="estimatedAdCart"
            stackId="cart"
            fill={COLOR_AD}
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
            animationDuration={300}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
