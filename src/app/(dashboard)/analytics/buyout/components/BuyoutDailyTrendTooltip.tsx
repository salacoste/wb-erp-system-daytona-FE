/**
 * BuyoutDailyTrendTooltip Component
 *
 * Custom Recharts tooltip showing daily buyout metrics.
 * Shows date header + visible metric values with colored dots.
 */

import {
  BUYOUT_TREND_COLORS,
  BUYOUT_TREND_LABELS,
  BUYOUT_TREND_SERIES,
  formatDailyTooltipDate,
  type BuyoutTrendMetricKey,
} from './buyout-daily-trend-config'
import { formatPercentage } from '@/lib/formatters'
import type { DailyBuyoutPoint } from '@/types/buyout-daily'

// ============================================================================
// Types
// ============================================================================

interface TooltipPayloadItem {
  dataKey: string
  value: number
  payload: DailyBuyoutPoint
}

interface BuyoutDailyTrendTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  visibleSeries: string[]
}

// ============================================================================
// Component
// ============================================================================

export function BuyoutDailyTrendTooltip({
  active,
  payload,
  visibleSeries,
}: BuyoutDailyTrendTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const dataPoint = payload[0].payload

  return (
    <div
      className="rounded-lg border border-border bg-card p-3 shadow-lg"
      style={{ maxWidth: 260 }}
    >
      <p className="mb-2 border-b border-border pb-2 text-sm font-semibold text-foreground">
        {formatDailyTooltipDate(dataPoint.date)}
      </p>
      <div className="space-y-1.5">
        {BUYOUT_TREND_SERIES.filter(s => visibleSeries.includes(s.key)).map(series => {
          const value = dataPoint[series.key as keyof DailyBuyoutPoint] as number | null
          const isPercent = series.key === 'buyoutRate' || series.key === 'returnRate'
          return (
            <div key={series.key} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: BUYOUT_TREND_COLORS[series.key as BuyoutTrendMetricKey],
                  }}
                />
                <span className="text-muted-foreground">
                  {BUYOUT_TREND_LABELS[series.key as BuyoutTrendMetricKey]}
                </span>
              </span>
              <span className="font-medium tabular-nums">
                {value == null
                  ? '—'
                  : isPercent
                    ? formatPercentage(value)
                    : value.toLocaleString('ru-RU')}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
