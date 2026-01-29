'use client'

/**
 * FbsTrendsChart Component
 * Story 51.4-FE: FBS Trends Chart
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Multi-line Recharts chart showing orders, revenue, and cancellations trends.
 * Features toggle visibility for metrics, data source indicator, and custom tooltip.
 */

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'
import { useFbsTrends, type UseFbsTrendsOptions } from '@/hooks/useFbsAnalytics'
import { DataSourceIndicator } from './DataSourceIndicator'
import { FbsTrendsTooltip } from './FbsTrendsTooltip'
import { FbsTrendsLegend } from './FbsTrendsLegend'
import {
  FbsTrendsChartLoading,
  FbsTrendsChartError,
  FbsTrendsChartEmpty,
} from './FbsTrendsChartStates'
import {
  formatChartDate,
  DEFAULT_METRIC_VISIBILITY,
  CHART_LINE_COLORS,
  type MetricVisibility,
} from '@/lib/fbs-analytics-utils'
import type { AggregationType, FbsTrendsParams } from '@/types/fbs-analytics'

// ============================================================================
// Component Props
// ============================================================================

interface FbsTrendsChartProps {
  /** Start date (YYYY-MM-DD) */
  from: string
  /** End date (YYYY-MM-DD) */
  to: string
  /** Aggregation level */
  aggregation?: AggregationType
  /** Optional height in pixels (default: 400, min: 300) */
  height?: number
  /** Additional class names */
  className?: string
  /** Query options (enabled, refetchInterval) */
  queryOptions?: UseFbsTrendsOptions
}

// ============================================================================
// Component
// ============================================================================

/**
 * Multi-line chart displaying FBS order trends
 *
 * @example
 * <FbsTrendsChart from="2025-12-31" to="2026-01-29" />
 * <FbsTrendsChart from="2025-01-01" to="2025-12-31" aggregation="month" height={500} />
 */
export function FbsTrendsChart({
  from,
  to,
  aggregation = 'day',
  height = 400,
  className,
  queryOptions,
}: FbsTrendsChartProps) {
  const [visibility, setVisibility] = useState<MetricVisibility>(DEFAULT_METRIC_VISIBILITY)
  const params: FbsTrendsParams = { from, to, aggregation }
  const { data, isLoading, error, refetch } = useFbsTrends(params, queryOptions)

  const toggleMetric = useCallback((metric: keyof MetricVisibility) => {
    setVisibility(prev => {
      const visibleCount = Object.values(prev).filter(Boolean).length
      if (prev[metric] && visibleCount <= 1) return prev
      return { ...prev, [metric]: !prev[metric] }
    })
  }, [])

  const chartHeight = Math.max(height, 300)

  if (isLoading) return <FbsTrendsChartLoading className={className} height={chartHeight} />
  if (error) return <FbsTrendsChartError className={className} onRetry={() => refetch()} />
  if (!data?.trends || data.trends.length === 0) {
    return <FbsTrendsChartEmpty className={className} />
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Динамика заказов FBS</CardTitle>
        <DataSourceIndicator source={data.dataSource.primary} showTooltip />
      </CardHeader>
      <CardContent>
        <FbsTrendsLegend visibility={visibility} onToggle={toggleMetric} className="mb-4" />
        <div aria-label="График динамики заказов FBS" role="img">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={data.trends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="date"
                tickFormatter={formatChartDate}
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<FbsTrendsTooltip visibility={visibility} />} />
              {visibility.orders && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="ordersCount"
                  stroke={CHART_LINE_COLORS.orders}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              )}
              {visibility.revenue && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_LINE_COLORS.revenue}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              )}
              {visibility.cancellations && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="cancellations"
                  stroke={CHART_LINE_COLORS.cancellations}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
