/**
 * Trends Chart Component
 * Story 63.12-FE: Historical Trends Dashboard Section
 *
 * Multi-line Recharts chart for displaying historical trends.
 *
 * @see docs/stories/epic-63/story-63.12-fe-historical-trends-section.md
 */

'use client'

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
import { formatCurrency, cn } from '@/lib/utils'
import {
  TRENDS_METRIC_MAP,
  formatWeekLabel,
  formatCompactValue,
  type TrendsMetricKey,
} from './trends-config'
import type { WeeklyTrendDataPoint } from '@/types/api'

export interface TrendsChartProps {
  /** Array of trend data points */
  data: WeeklyTrendDataPoint[]
  /** Set of visible metrics */
  visibleMetrics: Set<TrendsMetricKey>
  /** Chart height in pixels */
  height?: number
  /** Additional CSS classes */
  className?: string
}

interface TooltipPayloadItem {
  dataKey: string
  value: number
  color: string
  name: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

/**
 * Custom tooltip component
 */
function CustomTooltip({ active, payload, label }: CustomTooltipProps): React.ReactElement | null {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg">
      <p className="mb-2 font-medium">{label}</p>
      {payload.map(entry => {
        const metric = TRENDS_METRIC_MAP[entry.dataKey as TrendsMetricKey]
        if (!metric) return null

        const formattedValue =
          metric.format === 'percentage'
            ? `${entry.value.toFixed(1).replace('.', ',')}%`
            : formatCurrency(entry.value)

        return (
          <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
            {metric.label}: {formattedValue}
          </p>
        )
      })}
    </div>
  )
}

/**
 * Multi-line trend chart using Recharts
 */
export function TrendsChart({
  data,
  visibleMetrics,
  height = 300,
  className,
}: TrendsChartProps): React.ReactElement {
  // Check if margin metric is visible (for right Y-axis)
  const hasMarginMetric = visibleMetrics.has('margin_pct')

  // Format data for chart (add formatted week label)
  const chartData = useMemo(
    () =>
      data.map(point => ({
        ...point,
        weekLabel: formatWeekLabel(point.week),
      })),
    [data]
  )

  // Get visible metric configs
  const visibleMetricConfigs = useMemo(
    () =>
      Array.from(visibleMetrics)
        .map(key => TRENDS_METRIC_MAP[key])
        .filter(Boolean),
    [visibleMetrics]
  )

  if (!data.length) {
    return (
      <div
        className={cn('flex items-center justify-center', className)}
        style={{ height }}
        role="img"
        aria-label="График трендов: нет данных"
      >
        <p className="text-muted-foreground">Нет данных для отображения</p>
      </div>
    )
  }

  return (
    <div className={className} role="img" aria-label={`График трендов за ${data.length} недель`}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 20, right: 60, bottom: 20, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

          <XAxis dataKey="weekLabel" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />

          {/* Left Y-axis for currency values */}
          <YAxis
            yAxisId="left"
            tickFormatter={formatCompactValue}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />

          {/* Right Y-axis for percentage (margin) - only if visible */}
          {hasMarginMetric && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={v => `${v}%`}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 'auto']}
            />
          )}

          <Tooltip content={<CustomTooltip />} />

          {/* Render lines for visible metrics */}
          {visibleMetricConfigs.map(metric => (
            <Line
              key={metric.key}
              type="monotone"
              dataKey={metric.key}
              yAxisId={metric.yAxisId}
              stroke={metric.color}
              strokeWidth={2}
              dot={{ r: 4, fill: metric.color }}
              activeDot={{ r: 6 }}
              name={metric.label}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
