/**
 * DailyBreakdownTooltip Component
 * Story 62.6-FE: Daily Breakdown Chart Component
 *
 * Custom Recharts tooltip showing all metric values for a hovered day.
 * Features date header, colored dots, and formatted currency values.
 *
 * @see docs/stories/epic-62/story-62.6-fe-daily-breakdown-chart.md
 */

import { formatCurrency } from '@/lib/utils'
import { CHART_COLORS, METRIC_LABELS, formatTooltipDate, type MetricKey } from './chart-config'
import type { DailyMetrics } from '@/types/daily-metrics'

// ============================================================================
// Types
// ============================================================================

interface TooltipPayloadItem {
  dataKey: string
  value: number
  color: string
  payload: DailyMetrics
}

interface DailyBreakdownTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  visibleSeries: string[]
}

// ============================================================================
// Metric Display Order
// ============================================================================

const METRIC_ORDER: MetricKey[] = [
  'orders',
  'sales',
  'ordersCogs',
  'salesCogs',
  'advertising',
  'logistics',
  'storage',
  'profit',
]

// ============================================================================
// Component
// ============================================================================

/**
 * Get metric value from data point
 * Maps 'profit' key to 'theoreticalProfit' in DailyMetrics
 */
function getMetricValue(dataPoint: DailyMetrics, metricKey: MetricKey): number {
  if (metricKey === 'profit') {
    return dataPoint.theoreticalProfit ?? 0
  }
  // For other keys, access directly (they exist on DailyMetrics)
  const value =
    dataPoint[metricKey as keyof Omit<DailyMetrics, 'date' | 'dayOfWeek' | 'theoreticalProfit'>]
  return typeof value === 'number' ? value : 0
}

/**
 * Custom tooltip for Daily Breakdown chart
 * Shows date header + all visible metric values
 */
export function DailyBreakdownTooltip({
  active,
  payload,
  visibleSeries,
}: DailyBreakdownTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const dataPoint = payload[0].payload

  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
      style={{ maxWidth: 280 }}
    >
      {/* Date header */}
      <p className="mb-2 border-b border-gray-200 pb-2 text-sm font-semibold text-gray-900">
        {formatTooltipDate(dataPoint.date)}
      </p>

      {/* Metrics */}
      <div className="space-y-1.5">
        {METRIC_ORDER.filter(key => visibleSeries.includes(key)).map(metricKey => (
          <TooltipMetricRow
            key={metricKey}
            metricKey={metricKey}
            value={getMetricValue(dataPoint, metricKey)}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Subcomponent: Metric Row
// ============================================================================

interface TooltipMetricRowProps {
  metricKey: MetricKey
  value: number
}

function TooltipMetricRow({ metricKey, value }: TooltipMetricRowProps) {
  const isProfit = metricKey === 'profit'
  const color = CHART_COLORS[metricKey]
  const label = METRIC_LABELS[metricKey]

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2">
        {/* Colored indicator: diamond for profit, dot for others */}
        {isProfit ? (
          <span className="h-3 w-3 rotate-45" style={{ backgroundColor: color }} />
        ) : (
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        )}
        <span className="text-gray-600">{label}</span>
      </span>
      <span className="font-medium tabular-nums">{formatCurrency(value)}</span>
    </div>
  )
}
