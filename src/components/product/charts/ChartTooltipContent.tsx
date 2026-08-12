import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import {
  chartSeriesMarkerLabel,
  chartSeriesRoleLabel,
  type ChartSeriesMarker,
  type ChartSeriesRole,
  type ChartTooltipEntry,
} from './contracts'

const roleClass: Record<ChartSeriesRole, string> = {
  categorical: 'text-chart-1',
  positive: 'text-chart-positive',
  negative: 'text-chart-negative',
  reference: 'text-chart-reference',
  target: 'text-chart-target',
  forecast: 'text-chart-forecast',
  confidence: 'text-chart-confidence-band',
  selection: 'text-chart-selection',
}

const markerClass: Record<ChartSeriesMarker, string> = {
  solid: 'border-t-2 border-current',
  dashed: 'border-t-2 border-dashed border-current',
  dotted: 'border-t-2 border-dotted border-current',
  point: 'rounded-full border-2 border-current',
  bar: 'border border-current bg-current',
  area: 'border border-current bg-current/30',
  band: 'border-2 border-dashed border-current bg-current/20',
}

export type ChartTooltipContentProps = {
  label?: ReactNode
  entries: readonly ChartTooltipEntry[]
  className?: string
}

export function ChartTooltipContent({ label, entries, className }: ChartTooltipContentProps) {
  return (
    <div
      className={cn(
        'min-w-0 max-w-sm space-y-2 rounded-md border bg-chart-tooltip p-3 text-chart-tooltip-foreground shadow-md',
        className
      )}
      data-chart-tooltip
    >
      {label !== null && label !== undefined ? (
        <div className="break-words font-medium">{label}</div>
      ) : null}
      <ul className="space-y-2">
        {entries.map(entry => (
          <li key={entry.id} className="min-w-0 space-y-1 text-sm">
            <div className="flex min-w-0 items-start gap-2">
              <span
                aria-hidden="true"
                data-chart-marker
                className={cn(
                  'mt-2 inline-block h-3 w-4 shrink-0',
                  roleClass[entry.role],
                  markerClass[entry.marker]
                )}
              />
              <span className="min-w-0 flex-1 break-words">{entry.label}</span>
              <span className="shrink-0 text-right font-mono tabular-nums">
                {entry.formattedValue}
              </span>
              {entry.unit ? <span className="shrink-0">{entry.unit}</span> : null}
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span>{chartSeriesRoleLabel[entry.role]}</span>
              <span>{chartSeriesMarkerLabel[entry.marker]}</span>
            </div>
            {entry.detail ? <div className="break-words text-xs">{entry.detail}</div> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
