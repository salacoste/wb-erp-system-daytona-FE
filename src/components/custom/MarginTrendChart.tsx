'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
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
  MARGIN_TREND_DATA_TABLE_ID,
  MarginTrendDataTable,
} from './margin-trend-chart/MarginTrendDataTable'
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
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

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

  if (error && (!data || data.length === 0)) {
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
        {error && data.length > 0 && (
          <Alert className="mb-4 border-status-warning/30 bg-status-warning/15">
            <AlertCircle className="h-4 w-4 text-status-warning" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>Не удалось обновить график. Показаны ранее загруженные данные.</span>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                Повторить
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <div
          role="img"
          aria-label="График маржинальности по неделям"
          aria-describedby={MARGIN_TREND_DATA_TABLE_ID}
        >
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
                  if (
                    cx === undefined ||
                    cy === undefined ||
                    !payload ||
                    payload.margin_pct === null
                  )
                    return null
                  const color = getMarginDotColor(payload.margin_pct)
                  return (
                    <circle cx={cx} cy={cy} r={4} fill={color} stroke={color} strokeWidth={1} />
                  )
                }}
                activeDot={(props: { cx?: number; cy?: number; payload?: MarginTrendPoint }) => {
                  const { cx, cy, payload } = props
                  if (
                    cx === undefined ||
                    cy === undefined ||
                    !payload ||
                    payload.margin_pct === null
                  )
                    return null
                  const color = getMarginDotColor(payload.margin_pct)
                  return (
                    <circle cx={cx} cy={cy} r={6} fill={color} stroke={color} strokeWidth={2} />
                  )
                }}
                isAnimationActive={!prefersReducedMotion}
                animationDuration={prefersReducedMotion ? 0 : 300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <MarginTrendDataTable data={data} />
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
