'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useMarginTrends, type MarginTrendsQueryParams } from '@/hooks/useMarginTrends'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useQueryClient } from '@tanstack/react-query'
import type { MarginTrendPoint } from '@/types/api'
import {
  formatWeekLabel,
  formatMarginAxis,
  calculateYDomain,
  getMarginDotColor,
} from './margin-trend-chart/margin-trend-utils'
import { MarginTrendTooltip } from './margin-trend-chart/MarginTrendTooltip'
import { MarginTrendSummary } from './margin-trend-chart/MarginTrendSummary'
import {
  MarginTrendLoading,
  MarginTrendError,
  MarginTrendEmpty,
} from './margin-trend-chart/MarginTrendStates'

/**
 * Margin trend chart component for time-series margin analysis
 * Story 4.7: Margin Analysis by Time Period
 *
 * Reference: docs/backend-response-10-margin-trends-endpoint.md
 */
interface MarginTrendChartProps {
  queryParams: MarginTrendsQueryParams
  title?: string
  description?: string
  height?: number
  className?: string
}

export function MarginTrendChart({
  queryParams,
  title = 'Анализ маржинальности по времени',
  description = 'Изменение маржи по неделям',
  height = 400,
  className,
}: MarginTrendChartProps) {
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = useMarginTrends(queryParams)

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics', 'margin-trends'] })
    refetch()
  }

  if (isLoading) {
    return (
      <MarginTrendLoading
        title={title}
        description={description}
        className={className}
        height={height}
      />
    )
  }

  if (error) {
    return <MarginTrendError title={title} className={className} onRetry={handleRetry} />
  }

  if (!data || data.length === 0) {
    return <MarginTrendEmpty title={title} description={description} className={className} />
  }

  const { marginValues, hasMarginData, minMargin, maxMargin, yDomain } = calculateYDomain(data)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="week"
              tickFormatter={formatWeekLabel}
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={yDomain}
              tickFormatter={formatMarginAxis}
              tick={{ fontSize: 12 }}
              label={{ value: 'Маржа (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<MarginTrendTooltip />} />
            <Legend formatter={() => 'Маржа (%)'} />
            <ReferenceLine
              y={0}
              stroke="var(--color-chart-reference)"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
            <Line
              type="monotone"
              dataKey="margin_pct"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              name="Маржа (%)"
              dot={(props: { cx?: number; cy?: number; payload?: MarginTrendPoint }) => {
                const { cx, cy, payload } = props
                if (cx === undefined || cy === undefined || !payload || payload.margin_pct === null)
                  return null
                const color = getMarginDotColor(payload.margin_pct)
                return <circle cx={cx} cy={cy} r={4} fill={color} stroke={color} strokeWidth={1} />
              }}
              activeDot={(props: { cx?: number; cy?: number; payload?: MarginTrendPoint }) => {
                const { cx, cy, payload } = props
                if (cx === undefined || cy === undefined || !payload || payload.margin_pct === null)
                  return null
                const color = getMarginDotColor(payload.margin_pct)
                return <circle cx={cx} cy={cy} r={6} fill={color} stroke={color} strokeWidth={2} />
              }}
            />
          </LineChart>
        </ResponsiveContainer>
        <MarginTrendSummary
          weeksCount={data.length}
          hasMarginData={hasMarginData}
          marginValues={marginValues}
          maxMargin={maxMargin}
          minMargin={minMargin}
        />
      </CardContent>
    </Card>
  )
}
