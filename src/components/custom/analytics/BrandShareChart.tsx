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
 * Story 170.4: design tokens (chart-1/2/3, border, chart-axis, background)
 * + filter-context subtitle + sr-only data alternative (BrandShareSrTable).
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
import { BRAND_SHARE_COLORS, formatBrandShareAxisDate } from './brand-share-chart-config'
import { BrandShareTooltip } from './BrandShareTooltip'
import { BrandShareSrTable } from './brand-share-sr-table'
import type { BrandShareReportPoint } from '@/types/brand-share'

interface BrandShareChartProps {
  /** Daily data points (already sorted by applyDate). */
  data: BrandShareReportPoint[]
  /** Filter context for the card subtitle (epic RTC: chart retains selections). */
  brand: string | null
  categoryName: string | null
  /** Human period label; null → «последние 7 дней» fallback. */
  periodLabel: string | null
}

export function BrandShareChart({ data, brand, categoryName, periodLabel }: BrandShareChartProps) {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    // jsdom (unit tests) doesn't implement matchMedia — guard so it doesn't throw.
    if (typeof window.matchMedia !== 'function') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  if (!data || data.length === 0) {
    // Round-1 LOW-1: filter context is rendered on the empty card too (epic RTC —
    // the user must see their selection scope when the report comes back empty).
    // LOW-2: subtitle computation moved below this guard (was dead on the empty path).
    const subtitle = `${brand ?? '—'} · ${categoryName ?? '—'} · ${periodLabel ?? 'последние 7 дней'}`
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Доля бренда в категории</CardTitle>
          <p className="text-xs text-muted-foreground" data-testid="brand-share-filter-context">
            {subtitle}
          </p>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Нет данных о доле бренда за выбранный период</p>
        </CardContent>
      </Card>
    )
  }

  const subtitle = `${brand ?? '—'} · ${categoryName ?? '—'} · ${periodLabel ?? 'последние 7 дней'}`

  const animationDuration = prefersReducedMotion ? 0 : 300

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Доля бренда в категории</CardTitle>
        <p className="text-xs text-muted-foreground" data-testid="brand-share-filter-context">
          {subtitle}
        </p>
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
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="applyDate"
                tickFormatter={formatBrandShareAxisDate}
                tick={{ fontSize: 12, fill: 'var(--color-chart-axis)' }}
                axisLine={{ stroke: 'var(--color-border)' }}
                tickLine={{ stroke: 'var(--color-border)' }}
              />
              <YAxis
                yAxisId="share"
                domain={[0, 100]}
                tickFormatter={(v: number) => formatPercentage(v)}
                tick={{ fontSize: 12, fill: 'var(--color-chart-axis)' }}
                axisLine={{ stroke: 'var(--color-border)' }}
                tickLine={false}
                width={64}
              />
              <YAxis
                yAxisId="rating"
                orientation="right"
                reversed
                allowDecimals={false}
                tick={{ fontSize: 12, fill: 'var(--color-chart-axis)' }}
                axisLine={{ stroke: 'var(--color-border)' }}
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
                dot={{ r: 3, strokeWidth: 2, fill: 'var(--color-background)' }}
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
                dot={{ r: 3, strokeWidth: 2, fill: 'var(--color-background)' }}
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
                dot={{ r: 3, strokeWidth: 2, fill: 'var(--color-background)' }}
                connectNulls
                animationDuration={animationDuration}
              />
            </LineChart>
          </ResponsiveContainer>
        </ResponsiveChartFrame>
        <BrandShareSrTable data={data} />
      </CardContent>
    </Card>
  )
}
