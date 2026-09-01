'use client'

import { useCallback, useMemo, useState } from 'react'
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
import { cn, formatCurrency } from '@/lib/utils'
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
  formatNumber,
  getAggregationLabel,
  DEFAULT_METRIC_VISIBILITY,
  CHART_LINE_COLORS,
  type MetricVisibility,
} from '@/lib/fbs-analytics-utils'
import type { AggregationType, FbsTrendsParams } from '@/types/fbs-analytics'

interface FbsTrendsChartProps {
  from: string
  to: string
  aggregation?: AggregationType
  height?: number
  className?: string
  queryOptions?: UseFbsTrendsOptions
}

const FBS_TRENDS_TABLE_ID = 'fbs-trends-chart-data'

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
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

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
        <div
          aria-label="График динамики заказов FBS"
          aria-describedby={FBS_TRENDS_TABLE_ID}
          role="img"
        >
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
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={prefersReducedMotion ? 0 : 300}
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
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={prefersReducedMotion ? 0 : 300}
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
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={prefersReducedMotion ? 0 : 300}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <table id={FBS_TRENDS_TABLE_ID} className="sr-only" data-chart-summary>
          <caption>{`Данные графика динамики заказов FBS; период: ${data.period.from} — ${data.period.to}; агрегация: ${getAggregationLabel(data.period.aggregation)}; единицы: заказы и отмены — штуки, выручка — рубли`}</caption>
          <thead>
            <tr>
              <th scope="col">Дата</th>
              <th scope="col">Заказы, шт.</th>
              <th scope="col">Выручка, ₽</th>
              <th scope="col">Отмены, шт.</th>
            </tr>
          </thead>
          <tbody>
            {data.trends.map(point => (
              <tr key={point.date}>
                <th scope="row">{point.date}</th>
                <td>{formatNumber(point.ordersCount)}</td>
                <td>{formatCurrency(point.revenue)}</td>
                <td>{formatNumber(point.cancellations)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
