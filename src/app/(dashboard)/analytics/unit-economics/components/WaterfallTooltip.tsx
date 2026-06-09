'use client'

/**
 * Waterfall Chart Tooltip & Legend Components
 * Story 5.3: Cost Breakdown Visualization
 *
 * Sub-components for the waterfall chart display.
 * Extracted from UnitEconomicsWaterfall.tsx (Epic 74 - file size compliance).
 */

import { formatCurrency, formatPercentage } from '@/lib/unit-economics-utils'
import type { WaterfallChartDataPoint } from './waterfall-chart-utils'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: WaterfallChartDataPoint }>
}

/** Recharts custom tooltip for waterfall chart bars */
export function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: data.fill }} />
        <span className="font-semibold text-foreground">{data.name}</span>
      </div>
      <div className="space-y-1">
        <div className="text-lg font-bold text-foreground">
          {formatCurrency(data.absoluteValue)}
        </div>
        <div className="text-sm text-muted-foreground">
          {formatPercentage(data.percentage)} от выручки
        </div>
      </div>
    </div>
  )
}

interface WaterfallLegendProps {
  items: Array<{ name: string; color: string }>
}

/** Color legend displayed below the waterfall chart */
export function WaterfallLegend({ items }: WaterfallLegendProps) {
  return (
    <div className="flex flex-wrap gap-4 justify-center mt-4 px-4">
      {items.map(item => (
        <div key={item.name} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
          <span className="text-xs text-muted-foreground">{item.name}</span>
        </div>
      ))}
    </div>
  )
}
