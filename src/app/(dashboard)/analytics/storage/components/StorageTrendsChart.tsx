'use client'

/**
 * Storage Trends Chart
 * Story 24.5-FE: Storage Trends Chart
 * Story 24.10-FE: Chart Click-to-Filter Interaction
 * Epic 24: Paid Storage Analytics (Frontend)
 *
 * Shows storage costs over time with trend indicators.
 * UX Decision Q12: Show gaps for null data (don't interpolate)
 * Click on data point to filter tables to that week (Story 24.10)
 */

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { HelpCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { StorageTrendPoint, MoneyMetricSummary } from '@/types/storage-analytics'
import { CHART_COLORS } from './storage-trends-config'
import { formatWeekShort } from './storage-format'
import { TrendBadge, SummaryStats, CustomTooltip, CustomDot } from './StorageTrendsChartParts'
import { ResponsiveChartFrame } from '@/components/custom/analytics/ResponsiveChartFrame'
// Story 169.12: sr-only data alternative (169.11 ReturnTrendSrTable precedent)
import { STORAGE_TREND_DATA_TABLE_ID, StorageTrendSrTable } from './StorageTrendSrTable'

// Barrel re-exports for consumers (formatters single-sourced in storage-format,
// Story 169.12 dedupe)
export { CHART_COLORS } from './storage-trends-config'
export { formatCurrency, formatWeekShort } from './storage-format'
export { TrendBadge, SummaryStats, CustomTooltip, CustomDot } from './StorageTrendsChartParts'
export type { TooltipPayload, CustomDotProps } from './StorageTrendsChartParts'

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

interface StorageTrendsChartProps {
  data: StorageTrendPoint[]
  summary?: MoneyMetricSummary
  isLoading?: boolean
  height?: number
  /** Story 24.10: Currently selected week for filtering */
  selectedWeek?: string | null
  /** Story 24.10: Callback when a week is clicked */
  onWeekClick?: (week: string) => void
}

export function StorageTrendsChart({
  data,
  summary,
  isLoading = false,
  height = 250,
  selectedWeek,
  onWeekClick,
}: StorageTrendsChartProps) {
  const reduceMotion = prefersReducedMotion()
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-4 w-64" />
        <Skeleton className="w-full" style={{ height }} />
      </div>
    )
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground border rounded-lg bg-muted/20"
        style={{ height }}
      >
        Нет данных за выбранный период
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with trend badge and data source info */}
      {summary && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SummaryStats summary={summary} />
            <TooltipProvider>
              <UiTooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help mb-4" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px]">
                  <p className="text-xs">
                    Тренд по данным API платного хранения (ежедневная агрегация по неделям).
                  </p>
                </TooltipContent>
              </UiTooltip>
            </TooltipProvider>
          </div>
          <TrendBadge trend={summary.trend} />
        </div>
      )}

      {/* Chart */}
      <ResponsiveChartFrame
        label="График расходов на платное хранение по неделям"
        descriptionId={STORAGE_TREND_DATA_TABLE_ID}
        minHeightClassName="min-h-0"
        style={{ height }}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="storageFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.storage} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.storage} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="week"
              tickFormatter={formatWeekShort}
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={{ stroke: 'var(--color-border)' }}
            />
            <YAxis
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={{ stroke: 'var(--color-border)' }}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Story 24.10: Use CustomDot for click-to-filter with visual highlight */}
            <Area
              type="monotone"
              dataKey="storage_cost"
              stroke={CHART_COLORS.storage}
              fill="url(#storageFill)"
              strokeWidth={2}
              connectNulls={false}
              isAnimationActive={!reduceMotion}
              dot={props => (
                <CustomDot {...props} selectedWeek={selectedWeek} onClick={onWeekClick} />
              )}
              activeDot={{
                r: 6,
                stroke: CHART_COLORS.storage,
                strokeWidth: 2,
                cursor: 'pointer',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ResponsiveChartFrame>

      {/* Story 169.12: sr-only every-week data alternative at tooltip precision */}
      <StorageTrendSrTable data={data} />
    </div>
  )
}
