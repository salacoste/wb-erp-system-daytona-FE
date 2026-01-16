'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { StorageTrendPoint, MetricSummary } from '@/types/storage-analytics'

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

// Chart color scheme - purple for storage to differentiate from other charts
// Story 24.10: Added selected color for click-to-filter highlight
const CHART_COLORS = {
  storage: '#7C4DFF',
  selected: '#C62828', // Red-800 for selected week (matches sidebar active color)
  gradientStart: 'rgba(124, 77, 255, 0.3)',
  gradientEnd: 'rgba(124, 77, 255, 0)',
}

// Format currency for display
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

// Format week label: "2025-W44" → "W44"
const formatWeekShort = (week: string): string => {
  return week.split('-')[1] || week
}

// Trend Badge Component
function TrendBadge({ trend }: { trend: number }) {
  const isPositive = trend > 0
  const isNegative = trend < 0

  // For storage costs: increase is bad (red), decrease is good (green)
  const colorClass = isPositive
    ? 'text-red-600 bg-red-50'
    : isNegative
      ? 'text-green-600 bg-green-50'
      : 'text-gray-600 bg-gray-50'

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  return (
    <div className={cn('flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium', colorClass)}>
      <Icon className="h-4 w-4" />
      <span>{isPositive ? '+' : ''}{trend.toFixed(1)}%</span>
    </div>
  )
}

// Summary Stats Component
function SummaryStats({ summary }: { summary: MetricSummary }) {
  return (
    <div className="flex flex-wrap gap-4 text-sm mb-4">
      <div>
        <span className="text-muted-foreground">Мин: </span>
        <span className="font-medium">{formatCurrency(summary.min)}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Макс: </span>
        <span className="font-medium">{formatCurrency(summary.max)}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Среднее: </span>
        <span className="font-medium">{formatCurrency(summary.avg)}</span>
      </div>
    </div>
  )
}

// Custom Tooltip Component
interface TooltipPayload {
  payload: StorageTrendPoint
}

function CustomTooltip({
  active,
  payload,
  label
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload
  const hasData = data.storage_cost !== null && data.storage_cost !== undefined

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3">
      <p className="font-medium text-sm">Неделя {formatWeekShort(label || data.week)}</p>
      {hasData ? (
        <p className="text-lg font-bold" style={{ color: CHART_COLORS.storage }}>
          {formatCurrency(data.storage_cost!)}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Нет данных за эту неделю
        </p>
      )}
    </div>
  )
}

/**
 * Story 24.10: Custom dot component for click-to-filter interaction
 * Shows larger highlighted dot when week is selected
 */
interface CustomDotProps {
  cx?: number
  cy?: number
  payload?: StorageTrendPoint
  selectedWeek?: string | null
  onClick?: (week: string) => void
}

function CustomDot({ cx, cy, payload, selectedWeek, onClick }: CustomDotProps) {
  if (!cx || !cy || !payload || payload.storage_cost === null) return null

  const isSelected = payload.week === selectedWeek
  const radius = isSelected ? 8 : 4
  const fillColor = isSelected ? CHART_COLORS.selected : CHART_COLORS.storage

  return (
    <circle
      cx={cx}
      cy={cy}
      r={radius}
      fill={fillColor}
      stroke="white"
      strokeWidth={2}
      style={{ cursor: 'pointer' }}
      onClick={() => onClick?.(payload.week)}
    />
  )
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
      {/* Header with trend badge */}
      {summary && (
        <div className="flex items-center justify-between">
          <SummaryStats summary={summary} />
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
            dot={(props) => (
              <CustomDot
                {...props}
                selectedWeek={selectedWeek}
                onClick={onWeekClick}
              />
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
