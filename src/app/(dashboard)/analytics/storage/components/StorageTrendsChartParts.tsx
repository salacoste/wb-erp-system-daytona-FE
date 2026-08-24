'use client'

/**
 * Storage Trends Chart - Sub-components
 * Extracted from StorageTrendsChart.tsx
 * Epic 24: Paid Storage Analytics (Frontend)
 *
 * Contains: TrendBadge, SummaryStats, CustomTooltip, CustomDot
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn, formatPercentage } from '@/lib/utils'
import type { StorageTrendPoint, MoneyMetricSummary } from '@/types/storage-analytics'
import { CHART_COLORS } from './storage-trends-config'
import { formatCurrency, formatWeekShort } from './storage-format'

// Trend Badge Component
export function TrendBadge({ trend }: { trend: number }) {
  const isPositive = trend > 0
  const isNegative = trend < 0

  // For storage costs increase is bad → financial-negative, decrease is good →
  // financial-positive; matched /15 tint pairs, both-theme safe (Story 169.12,
  // replacing light-only red/green/gray-50 pairs; 169.10 AA foreground lesson).
  const colorClass = isPositive
    ? 'text-financial-negative bg-financial-negative/15'
    : isNegative
      ? 'text-financial-positive bg-financial-positive/15'
      : 'text-muted-foreground bg-muted'

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  return (
    <div
      className={cn('flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium', colorClass)}
    >
      <Icon className="h-4 w-4" />
      <span>
        {/* Sign contract: '+' is prepended ONLY for positive trend; formatPercentage emits the
            minus sign for negatives itself (U+002D on current ICU; "-5,0 %"), and nothing for 0
            ("0,0 %"). Do not also enable signDisplay on formatPercentage or positives → "++5,0 %". */}
        {isPositive ? '+' : ''}
        {formatPercentage(trend, 1)}
      </span>
    </div>
  )
}

// Summary Stats Component — renders storage_cost (money) summary.
// BD-44/AP#8: min/max/avg are nullable money; null renders '—' (never «0 ₽»).
export function SummaryStats({ summary }: { summary: MoneyMetricSummary }) {
  return (
    <div className="flex flex-wrap gap-4 text-sm mb-4">
      <div>
        <span className="text-muted-foreground">Мин: </span>
        <span className="font-medium">
          {summary.min != null ? formatCurrency(summary.min) : '—'}
        </span>
      </div>
      <div>
        <span className="text-muted-foreground">Макс: </span>
        <span className="font-medium">
          {summary.max != null ? formatCurrency(summary.max) : '—'}
        </span>
      </div>
      <div>
        <span className="text-muted-foreground">Среднее: </span>
        <span className="font-medium">
          {summary.avg != null ? formatCurrency(summary.avg) : '—'}
        </span>
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
    <div className="bg-popover text-popover-foreground border rounded-lg shadow-lg p-3">
      <p className="font-medium text-sm">Неделя {formatWeekShort(label || data.week)}</p>
      {hasData ? (
        <p className="text-lg font-bold text-chart-1">{formatCurrency(data.storage_cost!)}</p>
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
      key={payload.week}
      cx={cx}
      cy={cy}
      r={radius}
      fill={fillColor}
      stroke="var(--color-background)"
      strokeWidth={2}
      style={{ cursor: 'pointer' }}
      onClick={() => onClick?.(payload.week)}
    />
  )
}
