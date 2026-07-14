'use client'

/**
 * BrandShareChart — recharts line chart for the PR4b brand-share time series.
 * Reference: docs/request-backend/225-brand-share-backend-contract.md
 *
 * Three daily series:
 *  - brandRating  (right axis, reversed — lower is better)
 *  - pricePercent (left axis, 0–100 %)
 *  - qtyPercent   (left axis, 0–100 %)
 *
 * Null percents → line gap (`connectNulls={false}`) — never «0 %» (AP#8).
 * Uses `formatPercentage` (no inline `%`) per the dot-locale-percent gate.
 */
import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveChartFrame } from '@/components/custom/analytics/ResponsiveChartFrame'
import { formatPercentage } from '@/lib/utils'
import {
  BRAND_SHARE_COLORS,
  formatBrandShareAxisDate,
  formatBrandShareTooltipDate,
} from './brand-share-chart-config'
import type { BrandShareReportPoint } from '@/types/brand-share'

interface BrandShareChartProps {
  /** Daily data points (already sorted by applyDate). */
  data: BrandShareReportPoint[]
}

interface TooltipEntryLike {
  dataKey?: string | number
  value?: number | null
}

/** Render a metric value; percents → formatPercentage, rating → plain number, null → «—». */
function formatMetricValue(dataKey: string | number | undefined, value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—'
  if (dataKey === 'brandRating') return value.toLocaleString('ru-RU')
  // pricePercent / qtyPercent already in 0–100 units → formatPercentage divides by 100.
  return formatPercentage(value)
}

function BrandShareTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipEntryLike[]
}) {
  if (!active || !payload || payload.length === 0) return null
  const first = payload[0] as { payload?: BrandShareReportPoint } | undefined
  const point = first?.payload ?? null
  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
      style={{ maxWidth: 260 }}
    >
      <p className="mb-2 border-b border-gray-200 pb-2 text-sm font-semibold text-gray-900">
        {point ? formatBrandShareTooltipDate(point.applyDate) : ''}
      </p>
      <div className="space-y-1.5">
        {payload.map(entry => {
          const key = String(entry.dataKey ?? '')
          const color = BRAND_SHARE_COLORS[key as keyof typeof BRAND_SHARE_COLORS]
          if (!color) return null
          return (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-gray-600">
                  {key === 'brandRating'
                    ? 'Рейтинг бренда'
                    : key === 'pricePercent'
                      ? 'Доля по цене'
                      : 'Доля по количеству'}
                </span>
              </span>
              <span className="font-medium tabular-nums">
                {formatMetricValue(key, entry.value ?? null)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function BrandShareChart({ data }: BrandShareChartProps) {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    // jsdom (unit tests) doesn't implement matchMedia — guard so it doesn't throw.
    if (typeof window.matchMedia !== 'function') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Доля бренда в категории</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Нет данных о доле бренда за выбранный период</p>
        </CardContent>
      </Card>
    )
  }

  const animationDuration = prefersReducedMotion ? 0 : 300

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Доля бренда в категории</CardTitle>
        <p className="text-xs text-muted-foreground">
          Рейтинг бренда: чем ниже — тем лучше позиция. Доли по цене/количеству — % от категории.
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveChartFrame
          label="График доли бренда в категории по дням"
          className="h-72 md:h-80"
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <LineChart data={data} margin={{ top: 12, right: 12, bottom: 40, left: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
              <XAxis
                dataKey="applyDate"
                tickFormatter={formatBrandShareAxisDate}
                tick={{ fontSize: 12, fill: '#757575' }}
                axisLine={{ stroke: '#EEEEEE' }}
                tickLine={{ stroke: '#EEEEEE' }}
              />
              <YAxis
                yAxisId="share"
                domain={[0, 100]}
                tickFormatter={(v: number) => formatPercentage(v)}
                tick={{ fontSize: 12, fill: '#757575' }}
                axisLine={{ stroke: '#EEEEEE' }}
                tickLine={false}
                width={64}
              />
              <YAxis
                yAxisId="rating"
                orientation="right"
                reversed
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#757575' }}
                axisLine={{ stroke: '#EEEEEE' }}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<BrandShareTooltip />} />
              <Line
                yAxisId="share"
                type="monotone"
                dataKey="pricePercent"
                name="Доля по цене"
                stroke={BRAND_SHARE_COLORS.pricePercent}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 2, fill: 'white' }}
                connectNulls={false}
                animationDuration={animationDuration}
              />
              <Line
                yAxisId="share"
                type="monotone"
                dataKey="qtyPercent"
                name="Доля по количеству"
                stroke={BRAND_SHARE_COLORS.qtyPercent}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 2, fill: 'white' }}
                connectNulls={false}
                animationDuration={animationDuration}
              />
              <Line
                yAxisId="rating"
                type="monotone"
                dataKey="brandRating"
                name="Рейтинг бренда"
                stroke={BRAND_SHARE_COLORS.brandRating}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={{ r: 3, strokeWidth: 2, fill: 'white' }}
                connectNulls
                animationDuration={animationDuration}
              />
            </LineChart>
          </ResponsiveContainer>
        </ResponsiveChartFrame>
      </CardContent>
    </Card>
  )
}
