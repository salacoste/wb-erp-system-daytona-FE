/**
 * LiquidityTrendTooltip Component
 * Story 165.4-FE: Liquidity Trends (Динамика ликвидности)
 *
 * Custom Recharts tooltip showing one trend day:
 * header date + frozen capital (₽), avg turnover (days), and the 4
 * distribution percentages. Renders ONLY the BE-provided point payload —
 * no synthesized values (AC2).
 */

import { formatCurrency, formatPercentage } from '@/lib/utils'
import {
  LIQUIDITY_TREND_COLORS,
  LIQUIDITY_TREND_LABELS,
  LIQUIDITY_DISTRIBUTION_LABELS,
  formatTrendTooltipDate,
} from './liquidity-trend-config'
import type {
  LiquidityTrendDistributionKey,
  LiquidityTrendMetricKey,
} from './liquidity-trend-config'
import type { TrendDataPoint } from '@/types/liquidity'

interface LiquidityTrendTooltipProps {
  active?: boolean
  payload?: Array<{ payload: TrendDataPoint }>
}

const METRIC_KEYS: LiquidityTrendMetricKey[] = ['frozen_capital', 'avg_turnover_days']
const DISTRIBUTION_KEYS: LiquidityTrendDistributionKey[] = [
  'highly_liquid_pct',
  'medium_pct',
  'low_pct',
  'illiquid_pct',
]

export function LiquidityTrendTooltip({ active, payload }: LiquidityTrendTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const point = payload[0].payload

  return (
    <div className="rounded-lg border bg-popover p-3 shadow-lg" style={{ maxWidth: 280 }}>
      <p className="text-popover-foreground mb-2 border-b border pb-2 text-sm font-semibold capitalize">
        {formatTrendTooltipDate(point.date)}
      </p>
      <div className="space-y-1.5">
        {METRIC_KEYS.map(key => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: LIQUIDITY_TREND_COLORS[key] }}
              />
              <span className="text-muted-foreground">{LIQUIDITY_TREND_LABELS[key]}</span>
            </span>
            <span className="text-popover-foreground font-medium tabular-nums">
              {key === 'frozen_capital'
                ? formatCurrency(point.frozen_capital)
                : `${Math.round(point.avg_turnover_days)} дн.`}
            </span>
          </div>
        ))}
        <div className="text-popover-foreground my-1 border-t border" />
        {DISTRIBUTION_KEYS.map(key => (
          <div key={key} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: LIQUIDITY_TREND_COLORS[key] }}
              />
              <span className="text-muted-foreground">{LIQUIDITY_DISTRIBUTION_LABELS[key]}</span>
            </span>
            <span className="text-popover-foreground font-medium tabular-nums">
              {formatPercentage(point.distribution[key])}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
