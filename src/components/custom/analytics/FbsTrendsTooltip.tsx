/**
 * FbsTrendsTooltip Component
 * Story 51.4-FE: FBS Trends Chart
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Custom Recharts tooltip for FBS trends chart showing formatted values
 * for orders, revenue, cancellations, and derived metrics.
 */

import { formatCurrency } from '@/lib/utils'
import {
  formatTooltipDate,
  formatNumber,
  formatPercentValue,
  CHART_LINE_COLORS,
  METRIC_LABELS,
  type MetricVisibility,
} from '@/lib/fbs-analytics-utils'
import type { TrendDataPoint } from '@/types/fbs-analytics'

// ============================================================================
// Tooltip Props
// ============================================================================

interface TooltipPayloadItem {
  dataKey: string
  value: number
  color: string
  payload: TrendDataPoint
}

interface FbsTrendsTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  visibility: MetricVisibility
}

// ============================================================================
// Component
// ============================================================================

/**
 * Custom tooltip for FBS Trends chart
 * Shows formatted date, visible metrics, and calculated values
 */
export function FbsTrendsTooltip({ active, payload, visibility }: FbsTrendsTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const dataPoint = payload[0].payload

  return (
    <div className="rounded-lg border bg-white p-3 shadow-md min-w-[200px]">
      {/* Date header */}
      <p className="font-semibold text-gray-900 mb-2 border-b pb-2">
        {formatTooltipDate(dataPoint.date)}
      </p>

      {/* Metrics */}
      <div className="space-y-1.5">
        {/* Orders */}
        {visibility.orders && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CHART_LINE_COLORS.orders }}
              />
              <span className="text-gray-600">{METRIC_LABELS.orders}:</span>
            </span>
            <span className="font-medium">{formatNumber(dataPoint.ordersCount)}</span>
          </div>
        )}

        {/* Revenue */}
        {visibility.revenue && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CHART_LINE_COLORS.revenue }}
              />
              <span className="text-gray-600">{METRIC_LABELS.revenue}:</span>
            </span>
            <span className="font-medium">{formatCurrency(dataPoint.revenue)}</span>
          </div>
        )}

        {/* Cancellations */}
        {visibility.cancellations && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CHART_LINE_COLORS.cancellations }}
              />
              <span className="text-gray-600">{METRIC_LABELS.cancellations}:</span>
            </span>
            <span className="font-medium">{formatNumber(dataPoint.cancellations)}</span>
          </div>
        )}
      </div>

      {/* Derived metrics separator */}
      <div className="mt-2 pt-2 border-t space-y-1">
        {/* Cancellation rate */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Процент отмен:</span>
          <span>{formatPercentValue(dataPoint.cancellationRate)}</span>
        </div>

        {/* Average order value */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Средний чек:</span>
          <span>{formatCurrency(dataPoint.avgOrderValue)}</span>
        </div>
      </div>
    </div>
  )
}
