'use client'

/**
 * Monitor Weekly Chart — 7-day line chart
 * Epic 92-FE Story 92.4: Продажи + Заказы + Возвраты trends over last 7 days.
 *
 * H-3 fix: 3 integer-count lines on a uniform Y-axis (no mixed revenue/count scale).
 * M-3 fix: two empty-state branches — "no data" (empty array) vs "all-zero traffic".
 *
 * Props: { data: DailyMetrics[] } — caller owns loading/error states.
 * Landmark: role="region" aria-label="График за 7 дней" + data-testid.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import type { DailyMetrics } from '@/types/daily-metrics'
import { transformDailyToChartRows, LINE_COLORS, LINE_LABELS } from './monitor-weekly-chart-utils'
import { WeeklyChartTooltip } from './monitor-weekly-chart-tooltip'

interface MonitorWeeklyChartProps {
  data: DailyMetrics[]
}

const EMPTY_STATE_CLASSES =
  'rounded-md border bg-background p-6 text-center text-sm text-muted-foreground'

/**
 * 7-day line chart showing Продажи / Заказы / Возвраты (all integer counts, uniform scale).
 * Consumes data from useDailyMetrics — caller owns loading/error states.
 */
export function MonitorWeeklyChart({ data }: MonitorWeeklyChartProps) {
  const chartData = transformDailyToChartRows(data)

  // M-3 fix: "no data" — array is empty (backend returned nothing for the window)
  if (chartData.length === 0) {
    return (
      <div
        role="region"
        aria-label="График за 7 дней"
        data-testid="monitor-weekly-chart"
        className={EMPTY_STATE_CLASSES}
      >
        Нет данных за последние 7 дней
      </div>
    )
  }

  // M-3 fix: "all-zero traffic" — array present but every row has zero counts
  if (chartData.every(r => r.sales === 0 && r.orders === 0 && r.returns === 0)) {
    return (
      <div
        role="region"
        aria-label="График за 7 дней"
        data-testid="monitor-weekly-chart"
        className={EMPTY_STATE_CLASSES}
      >
        За последние 7 дней не было активности
      </div>
    )
  }

  return (
    <div
      role="region"
      aria-label="График за 7 дней"
      data-testid="monitor-weekly-chart"
      className="rounded-md border bg-background p-4"
    >
      <h3 className="text-sm font-medium mb-4">За последние 7 дней</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip content={<WeeklyChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="sales"
            stroke={LINE_COLORS.sales}
            strokeWidth={2}
            name={LINE_LABELS.sales}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="orders"
            stroke={LINE_COLORS.orders}
            strokeWidth={2}
            name={LINE_LABELS.orders}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="returns"
            stroke={LINE_COLORS.returns}
            strokeWidth={2}
            name={LINE_LABELS.returns}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
