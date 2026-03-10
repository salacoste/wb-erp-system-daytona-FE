'use client'

/**
 * Storage Trends Chart - Sub-components
 * Extracted from StorageTrendsChart.tsx
 * Epic 24: Paid Storage Analytics (Frontend)
 *
 * Contains: TrendBadge, SummaryStats, CustomTooltip, CustomDot
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StorageTrendPoint, MetricSummary } from '@/types/storage-analytics'
import { CHART_COLORS, formatCurrency, formatWeekShort } from './storage-trends-config'

// Trend Badge Component
export function TrendBadge({ trend }: { trend: number }) {
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
    <div
      className={cn('flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium', colorClass)}
    >
      <Icon className="h-4 w-4" />
      <span>
        {isPositive ? '+' : ''}
        {trend.toFixed(1)}%
      </span>
    </div>
  )
}

// Summary Stats Component
export function SummaryStats({ summary }: { summary: MetricSummary }) {
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
export interface TooltipPayload {
  payload: StorageTrendPoint
}

export function CustomTooltip({
  active,
  payload,
  label,
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
        <p className="text-sm text-muted-foreground">Нет данных за эту неделю</p>
      )}
    </div>
  )
}

/**
 * Story 24.10: Custom dot component for click-to-filter interaction
 * Shows larger highlighted dot when week is selected
 */
export interface CustomDotProps {
  cx?: number
  cy?: number
  payload?: StorageTrendPoint
  selectedWeek?: string | null
  onClick?: (week: string) => void
}

export function CustomDot({ cx, cy, payload, selectedWeek, onClick }: CustomDotProps) {
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
