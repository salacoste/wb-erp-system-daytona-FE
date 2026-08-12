import { useId } from 'react'

import { cn } from '@/lib/utils'

import {
  chartSeriesMarkerLabel,
  chartSeriesRoleLabel,
  type ChartSeriesEvidence,
  type ChartSeriesMarker,
  type ChartSeriesRole,
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

export type ChartLegendProps = {
  label: string
  series: readonly ChartSeriesEvidence[]
  className?: string
}

export function ChartLegend({ label, series, className }: ChartLegendProps) {
  const generatedId = useId().replace(/:/g, '')

  return (
    <ul
      aria-label={label}
      className={cn('flex min-w-0 flex-wrap gap-x-4 gap-y-2', className)}
      data-chart-legend
    >
      {series.map((item, index) => (
        <li
          key={item.id}
          aria-label={item.label}
          aria-describedby={`chart-legend-${generatedId}-${index}-description`}
          data-series-role={item.role}
          data-series-marker={item.marker}
          data-visibility={item.visibility}
          className="flex min-w-0 flex-wrap items-center gap-2 text-sm"
        >
          <span
            aria-hidden="true"
            data-chart-marker
            className={cn(
              'inline-block h-3 w-4 shrink-0',
              roleClass[item.role],
              markerClass[item.marker]
            )}
          />
          <span className="break-words font-medium">{item.label}</span>
          <span
            id={`chart-legend-${generatedId}-${index}-description`}
            className="text-muted-foreground"
          >
            {chartSeriesRoleLabel[item.role]}. {chartSeriesMarkerLabel[item.marker]}.
            {item.visibility ? ` ${item.visibility === 'visible' ? 'Видима' : 'Скрыта'}.` : null}
          </span>
          {item.action !== null && item.action !== undefined ? (
            <span className="[&_a]:inline-flex [&_a]:min-h-11 [&_a]:min-w-11 [&_a]:items-center [&_a]:justify-center [&_button]:min-h-11 [&_button]:min-w-11 [&_[role=button]]:inline-flex [&_[role=button]]:min-h-11 [&_[role=button]]:min-w-11 [&_[role=button]]:items-center [&_[role=button]]:justify-center">
              {item.action}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
