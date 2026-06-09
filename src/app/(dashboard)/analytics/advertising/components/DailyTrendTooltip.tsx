/**
 * DailyTrendTooltip Component
 * Story 72.3-FE: Advertising Daily Trend Charts
 *
 * Custom Recharts tooltip showing daily advertising metrics.
 * Shows date header + visible metric values with colored dots.
 */

import { formatCurrency } from '@/lib/utils'
import {
  DAILY_TREND_COLORS,
  DAILY_TREND_LABELS,
  DAILY_TREND_SERIES,
  formatDailyTooltipDate,
  type DailyTrendMetricKey,
} from './daily-trend-config'
import type { AdvertisingDailyItem } from '@/types/advertising-analytics'

// ============================================================================
// Types
// ============================================================================

interface TooltipPayloadItem {
  dataKey: string
  value: number
  payload: AdvertisingDailyItem
}

interface DailyTrendTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  visibleSeries: string[]
}

// ============================================================================
// Component
// ============================================================================

export function DailyTrendTooltip({ active, payload, visibleSeries }: DailyTrendTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const dataPoint = payload[0].payload

  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
      style={{ maxWidth: 260 }}
    >
      <p className="mb-2 border-b border-gray-200 pb-2 text-sm font-semibold text-gray-900">
        {formatDailyTooltipDate(dataPoint.date)}
      </p>
      <div className="space-y-1.5">
        {DAILY_TREND_SERIES.filter(s => visibleSeries.includes(s.key)).map(series => {
          const value = dataPoint[series.key as keyof AdvertisingDailyItem] as number | null
          const isCurrency = series.key === 'spend'
          const isRoas = series.key === 'roas'
          return (
            <div key={series.key} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: DAILY_TREND_COLORS[series.key as DailyTrendMetricKey] }}
                />
                <span className="text-gray-600">
                  {DAILY_TREND_LABELS[series.key as DailyTrendMetricKey]}
                </span>
              </span>
              <span className="font-medium tabular-nums">
                {isRoas
                  ? value != null
                    ? `${value.toFixed(2)}x`
                    : '—'
                  : isCurrency
                    ? formatCurrency(value ?? 0)
                    : (value ?? 0).toLocaleString('ru-RU')}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
