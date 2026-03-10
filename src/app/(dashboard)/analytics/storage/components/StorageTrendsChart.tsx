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
import type { StorageTrendPoint, MetricSummary } from '@/types/storage-analytics'
import { CHART_COLORS, formatWeekShort } from './storage-trends-config'
import { TrendBadge, SummaryStats, CustomTooltip, CustomDot } from './StorageTrendsChartParts'

// Barrel re-exports for consumers
export { CHART_COLORS, formatCurrency, formatWeekShort } from './storage-trends-config'
export { TrendBadge, SummaryStats, CustomTooltip, CustomDot } from './StorageTrendsChartParts'
export type { TooltipPayload, CustomDotProps } from './StorageTrendsChartParts'

interface StorageTrendsChartProps {
  data: StorageTrendPoint[]
  summary?: MetricSummary
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
      <ResponsiveContainer width="100%" height={height}>
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
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
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
    </div>
  )
}
