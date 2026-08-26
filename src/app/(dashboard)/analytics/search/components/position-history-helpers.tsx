/**
 * PositionHistoryChart helpers — pure functions and shared types.
 * Extracted from PositionHistoryChart.tsx for 200-line ESLint cap compliance.
 */

import { formatDate } from '@/lib/utils'
import type { PositionHistoryPoint } from '@/types/search-position-trends'

/** Internal chart data shape after normalizing backend history points. */
export interface ChartDatum {
  date: string
  // AP#8: avgPosition preserves null — recharts renders a line gap, never a "0" point.
  avgPosition: number | null
  impressions: number
  clicks: number
}

/**
 * Shared color/style constants for the position history chart.
 * Story 170.7: legacy hex palette -> registered var() tokens, single-sourced in
 * search-chart-config.ts (line=chart-1, grid=border, tick=chart-axis; 169.4 canon).
 */
import { SEARCH_CHART_TOKENS } from './search-chart-config'

export const LINE_COLOR = SEARCH_CHART_TOKENS.line
export const GRID_STROKE = SEARCH_CHART_TOKENS.grid
export const TICK_FILL = SEARCH_CHART_TOKENS.tick

/** Convert API history points to chart-friendly data. */
export function toChartData(history: PositionHistoryPoint[]): ChartDatum[] {
  return history.map(p => ({
    date: p.date,
    avgPosition: p.avgPosition,
    impressions: p.impressions,
    clicks: p.clicks,
  }))
}

/** Compute [yMin, yMax] domain for the inverted Y-axis. */
export function computeYDomain(data: ChartDatum[]): [number, number] {
  if (data.length === 0) return [1, 100]
  const positions = data.map(d => d.avgPosition).filter((v): v is number => v != null && v > 0)
  if (positions.length === 0) return [1, 100]
  const yMax = Math.ceil(Math.max(...positions) / 5) * 5 + 5
  const yMin = Math.max(1, Math.floor(Math.min(...positions) / 5) * 5 - 5)
  return [yMin, yMax]
}

/** Format ISO date to DD.MM for chart axis ticks. */
export function formatChartDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`
}

/** Recharts tooltip content for position history. */
export function PositionTooltipContent({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: ChartDatum }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{formatDate(d.date)}</p>
      <p>
        Позиция:{' '}
        <span className="font-semibold">
          {d.avgPosition == null ? '—' : d.avgPosition.toFixed(1)}
        </span>
      </p>
      <p className="text-muted-foreground">
        Показы: {d.impressions} · Клики: {d.clicks}
      </p>
    </div>
  )
}
