/**
 * SeasonalPatternTooltip Component
 * Story 51.6-FE: Seasonal Patterns Components
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Custom Recharts tooltip for seasonal patterns chart.
 */

import { formatCurrency } from '@/lib/utils'
import { formatNumber } from '@/lib/fbs-analytics-utils'
import { translateMonth, translateDay, getQuarterRange } from '@/lib/seasonal-labels'
import type { SeasonalViewType } from '@/types/fbs-analytics'

// ============================================================================
// Types
// ============================================================================

interface TooltipData {
  name: string
  value: number
  revenue?: number
  original: string
  label?: string
}

interface TooltipPayloadItem {
  payload: TooltipData
}

interface SeasonalPatternTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  view: SeasonalViewType
}

// ============================================================================
// Helper Functions
// ============================================================================

function getTooltipTitle(view: SeasonalViewType, original: string): string {
  switch (view) {
    case 'monthly':
      return translateMonth(original)
    case 'weekly':
      return translateDay(original)
    case 'quarterly':
      return `${original} (${getQuarterRange(original)})`
    default:
      return original
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * Custom tooltip for seasonal patterns bar chart
 * Shows period name, average orders, and revenue (when available)
 */
export function SeasonalPatternTooltip({ active, payload, view }: SeasonalPatternTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const data = payload[0].payload
  const title = getTooltipTitle(view, data.original)

  return (
    <div className="rounded-lg border bg-white p-3 shadow-md min-w-[180px]">
      {/* Period header */}
      <p className="font-semibold text-gray-900 mb-2 border-b pb-2">{title}</p>

      {/* Metrics */}
      <div className="space-y-1.5">
        {/* Average Orders */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Средние заказы:</span>
          <span className="font-medium">{formatNumber(data.value)}</span>
        </div>

        {/* Average Revenue (for monthly/quarterly) */}
        {data.revenue !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Средняя выручка:</span>
            <span className="font-medium">{formatCurrency(data.revenue)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
