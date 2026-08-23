/**
 * ReturnTrendChart Tooltip & Legend — extracted for file-size compliance.
 *
 * Custom recharts tooltip and static legend for the returns daily trend chart.
 */

import {
  RETURNS_BAR_SERIES,
  RETURNS_DAILY_COLORS,
  RETURNS_DAILY_LABELS,
  formatReturnCount,
} from './returns-daily-trend-config'
import { formatPercentage } from '@/lib/utils'

// ============================================================================
// Custom Tooltip
// ============================================================================

interface TooltipPayloadItem {
  dataKey: string
  value: number
  color: string
}

export function ReturnTrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  const bars = payload.filter(p => p.dataKey !== 'returnRate')
  const rate = payload.find(p => p.dataKey === 'returnRate')

  return (
    <div className="rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg">
      <p className="mb-2 text-sm font-medium">{label}</p>
      {bars.map(item => (
        <p key={item.dataKey} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-muted-foreground">
            {RETURNS_DAILY_LABELS[item.dataKey] ?? item.dataKey}:
          </span>
          <span className="font-medium">{formatReturnCount(item.value)}</span>
        </p>
      ))}
      {rate && (
        <p className="mt-1 flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: rate.color }}
          />
          <span className="text-muted-foreground">{RETURNS_DAILY_LABELS.returnRate}:</span>
          <span className="font-medium">{formatPercentage(rate.value)}</span>
        </p>
      )}
    </div>
  )
}

// ============================================================================
// Custom Legend
// ============================================================================

export function ReturnTrendLegend() {
  const items = [
    ...RETURNS_BAR_SERIES.map(s => ({
      key: s.key,
      label: s.label,
      color: s.color,
      type: 'bar' as const,
    })),
    {
      key: 'returnRate',
      label: RETURNS_DAILY_LABELS.returnRate,
      color: RETURNS_DAILY_COLORS.returnRate,
      type: 'line' as const,
    },
  ]

  return (
    <div className="mb-4 flex flex-wrap gap-3" role="group" aria-label="Легенда графика возвратов">
      {items.map(item => (
        <span key={item.key} className="flex items-center gap-1.5 text-sm">
          <span
            className={item.type === 'line' ? 'h-0.5 w-3 rounded-full' : 'h-3 w-3 rounded-sm'}
            style={{ backgroundColor: item.color }}
          />
          <span>{item.label}</span>
        </span>
      ))}
    </div>
  )
}

// ReturnTrendSrTable extracted to its own file (ReturnTrendSrTable.tsx)
// in 169.11 round-1 review (F5) — isolates the sr-table from the tooltip.
