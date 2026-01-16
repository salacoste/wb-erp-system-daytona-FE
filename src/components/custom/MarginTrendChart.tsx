'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useMarginTrends, type MarginTrendsQueryParams } from '@/hooks/useMarginTrends'
import { formatCurrency } from '@/lib/utils'
import { formatMarginPercent } from '@/components/custom/MarginDisplay'
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
import { RefreshCw, AlertCircle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import type { MarginTrendPoint } from '@/types/api'

/**
 * Margin trend chart component for time-series margin analysis
 * Story 4.7: Margin Analysis by Time Period
 *
 * Displays margin percentage trends over multiple weeks with:
 * - Line chart showing margin % evolution
 * - Color coding: Green for positive, red for negative margins
 * - Interactive tooltips with detailed metrics
 * - Zero margin reference line
 * - Responsive design
 *
 * Reference: docs/backend-response-10-margin-trends-endpoint.md
 */
interface MarginTrendChartProps {
  /** Query parameters for margin trends (weeks or weekStart/weekEnd) */
  queryParams: MarginTrendsQueryParams
  /** Optional title override */
  title?: string
  /** Optional description override */
  description?: string
  /** Optional height in pixels (default: 400) */
  height?: number
  /** Optional className for the card */
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

  /**
   * Custom tooltip component showing detailed margin metrics
   * Displays: week, margin %, revenue, profit, units sold
   */
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: Array<{ dataKey: string; value: number; color: string; payload: MarginTrendPoint }>
  }) => {
    if (active && payload && payload.length > 0) {
      const dataPoint = payload[0].payload

      return (
        <div className="rounded-lg border bg-white p-3 shadow-md">
          {/* Week header */}
          <p className="font-semibold text-gray-900 mb-2">
            {dataPoint.week}
          </p>
          <p className="text-xs text-gray-500 mb-2">
            {formatDateRange(dataPoint.week_start_date, dataPoint.week_end_date)}
          </p>

          {/* Margin percentage */}
          {dataPoint.margin_pct !== null && dataPoint.margin_pct !== undefined ? (
            <p className="text-sm mb-1">
              <span className="text-gray-600">Маржа:</span>{' '}
              <span
                className={`font-medium ${
                  dataPoint.margin_pct > 0
                    ? 'text-green-600'
                    : dataPoint.margin_pct < 0
                      ? 'text-red-600'
                      : 'text-gray-600'
                }`}
              >
                {formatMarginPercent(dataPoint.margin_pct)}
              </span>
            </p>
          ) : (
            <p className="text-sm mb-1 text-gray-500">Маржа: нет данных</p>
          )}

          {/* Revenue */}
          <p className="text-sm mb-1">
            <span className="text-gray-600">Выручка:</span>{' '}
            <span className="font-medium">{formatCurrency(dataPoint.revenue_net)}</span>
          </p>

          {/* Profit */}
          {dataPoint.profit !== null && dataPoint.profit !== undefined ? (
            <p className="text-sm mb-1">
              <span className="text-gray-600">Прибыль:</span>{' '}
              <span className="font-medium">{formatCurrency(dataPoint.profit)}</span>
            </p>
          ) : null}

          {/* Units sold */}
          <p className="text-sm mb-1">
            <span className="text-gray-600">Продано:</span>{' '}
            <span className="font-medium">{dataPoint.qty} шт.</span>
          </p>

          {/* Missing COGS warning */}
          {dataPoint.missing_cogs_count > 0 && (
            <p className="text-xs text-amber-600 mt-2">
              ⚠️ Нет COGS для {dataPoint.missing_cogs_count} из {dataPoint.sku_count} SKU
            </p>
          )}
        </div>
      )
    }
    return null
  }

  /**
   * Format week for X-axis display
   * Converts "2025-W47" to "W47"
   */
  const formatWeekLabel = (week: string) => {
    return week.replace(/^\d{4}-/, '') // Remove year prefix
  }

  /**
   * Format margin percentage for Y-axis
   */
  const formatMarginAxis = (value: number) => {
    return `${value.toFixed(0)}%`
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full" style={{ height: `${height}px` }} />
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Не удалось загрузить данные трендов маржи. Пожалуйста, попробуйте еще раз.</span>
              <Button variant="outline" size="sm" onClick={handleRetry} className="ml-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Повторить
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Данные о трендах маржи пока недоступны. Тренды появятся после загрузки финансовых отчетов и назначения
              COGS для товаров.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Calculate Y-axis domain (add 10% padding to min/max margin)
  const marginValues = data.map((d) => d.margin_pct).filter((m): m is number => m !== null && m !== undefined)
  const hasMarginData = marginValues.length > 0
  const minMargin = hasMarginData ? Math.min(...marginValues) : -10
  const maxMargin = hasMarginData ? Math.max(...marginValues) : 50
  const padding = Math.abs(maxMargin - minMargin) * 0.1
  const yDomain = [Math.floor(minMargin - padding), Math.ceil(maxMargin + padding)]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />

            {/* X-Axis: Weeks */}
            <XAxis
              dataKey="week"
              tickFormatter={formatWeekLabel}
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12 }}
            />

            {/* Y-Axis: Margin % */}
            <YAxis
              domain={yDomain}
              tickFormatter={formatMarginAxis}
              tick={{ fontSize: 12 }}
              label={{ value: 'Маржа (%)', angle: -90, position: 'insideLeft' }}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={() => 'Маржа (%)'} />

            {/* Zero margin reference line */}
            <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" strokeWidth={1} />

            {/* Margin line with dynamic color */}
            <Line
              type="monotone"
              dataKey="margin_pct"
              stroke="#2563EB"
              strokeWidth={2}
              name="Маржа (%)"
              dot={(props: {
                cx?: number
                cy?: number
                payload?: MarginTrendPoint
              }) => {
                const { cx, cy, payload } = props
                if (cx === undefined || cy === undefined || !payload || payload.margin_pct === null) {
                  return null
                }
                const color = payload.margin_pct > 0 ? '#4CAF50' : payload.margin_pct < 0 ? '#EF4444' : '#9CA3AF'
                return <circle cx={cx} cy={cy} r={4} fill={color} stroke={color} strokeWidth={1} />
              }}
              activeDot={(props: {
                cx?: number
                cy?: number
                payload?: MarginTrendPoint
              }) => {
                const { cx, cy, payload } = props
                if (cx === undefined || cy === undefined || !payload || payload.margin_pct === null) {
                  return null
                }
                const color = payload.margin_pct > 0 ? '#4CAF50' : payload.margin_pct < 0 ? '#EF4444' : '#9CA3AF'
                return <circle cx={cx} cy={cy} r={6} fill={color} stroke={color} strokeWidth={2} />
              }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Summary statistics */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Недель</p>
            <p className="font-semibold">{data.length}</p>
          </div>
          {hasMarginData && (
            <>
              <div>
                <p className="text-gray-500">Средняя маржа</p>
                <p className="font-semibold">{formatMarginPercent(marginValues.reduce((a, b) => a + b, 0) / marginValues.length)}</p>
              </div>
              <div>
                <p className="text-gray-500">Макс. маржа</p>
                <p className="font-semibold text-green-600">{formatMarginPercent(maxMargin)}</p>
              </div>
              <div>
                <p className="text-gray-500">Мин. маржа</p>
                <p className="font-semibold text-red-600">{formatMarginPercent(minMargin)}</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Format date range for tooltip display
 * Example: "06.10 - 12.10"
 */
function formatDateRange(startDate: string, endDate: string): string {
  const formatShort = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    return `${day}.${month}`
  }

  return `${formatShort(startDate)} - ${formatShort(endDate)}`
}
