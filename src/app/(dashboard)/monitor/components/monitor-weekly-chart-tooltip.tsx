'use client'

/**
 * Monitor Weekly Chart — custom Recharts tooltip
 * Epic 92-FE Story 92.4: extracted to keep MonitorWeeklyChart.tsx under 180 lines.
 *
 * H-3f fix: shows all 3 series (Продажи / Заказы / Возвраты) with integer counts.
 * M-2 fix: defensive guard on payload shape before accessing row fields.
 */

import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { LINE_COLORS, LINE_LABELS } from './monitor-weekly-chart-utils'
import type { ChartRow } from './monitor-weekly-chart-utils'

interface TooltipPayload {
  dataKey: string
  value: number
  payload: ChartRow
}

interface WeeklyChartTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
}

/**
 * Custom Recharts tooltip in Russian.
 * Shows full date (e.g. "20 апреля 2026") + all 3 series values with colored bullets.
 */
export function WeeklyChartTooltip({ active, payload }: WeeklyChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const row = payload[0].payload
  // M-2 fix: defensive guard — malformed payload should not crash the tooltip
  if (!row || typeof row.date !== 'string') return null

  const fullDate = format(new Date(row.date), 'd MMMM yyyy', { locale: ru })

  return (
    <div className="rounded-md border bg-popover p-3 text-sm shadow-md">
      <p className="font-medium mb-2">{fullDate}</p>
      <div className="space-y-1">
        <TooltipRow
          color={LINE_COLORS.sales}
          label={LINE_LABELS.sales}
          value={row.sales.toLocaleString('ru-RU')}
        />
        <TooltipRow
          color={LINE_COLORS.orders}
          label={LINE_LABELS.orders}
          value={row.orders.toLocaleString('ru-RU')}
        />
        <TooltipRow
          color={LINE_COLORS.returns}
          label={LINE_LABELS.returns}
          value={row.returns.toLocaleString('ru-RU')}
        />
      </div>
    </div>
  )
}

function TooltipRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className="inline-block h-2 w-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  )
}
