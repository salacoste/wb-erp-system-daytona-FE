'use client'

/**
 * ProductAdvTrendChart — daily advertising trend for Unified Product Analytics.
 *
 * Dual-axis LineChart: spend (left, red) + orders (right, blue).
 * Consumes AdvDayItem[] from unified-product response.
 */

import { formatCurrency, formatNumber } from '@/lib/utils'
import type { AdvDayItem } from '@/types/unified-product'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = {
  spend: '#E53935',
  orders: '#3B82F6',
} as const

interface ProductAdvTrendChartProps {
  dates: AdvDayItem[]
}

function formatDay(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${d}.${m}`
}

export function ProductAdvTrendChart({ dates }: ProductAdvTrendChartProps) {
  const chartData = dates.map(d => ({
    date: formatDay(d.date),
    spend: d.spend,
    orders: d.orders,
  }))

  if (chartData.length === 0) return null

  return (
    <div role="img" aria-label="Динамика рекламных затрат и заказов по дням">
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis
            yAxisId="spend"
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => formatCurrency(v)}
            width={90}
          />
          <YAxis yAxisId="orders" orientation="right" tick={{ fontSize: 12 }} width={40} />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'Затраты') return [formatCurrency(value), name]
              return [formatNumber(value), name]
            }}
          />
          <Legend />
          <Line
            yAxisId="spend"
            type="monotone"
            dataKey="spend"
            stroke={COLORS.spend}
            strokeWidth={2}
            dot={false}
            name="Затраты"
          />
          <Line
            yAxisId="orders"
            type="monotone"
            dataKey="orders"
            stroke={COLORS.orders}
            strokeWidth={2}
            dot={false}
            name="Заказы"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
