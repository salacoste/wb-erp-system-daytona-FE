/**
 * Funnel Overlay Chart Sub-Components — Story 73.8-FE
 * Tooltip and legend for the overlay chart.
 */

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { OVERLAY_SERIES, fmtCurrency, type OverlaySeries } from './funnel-overlay-config'

interface OverlayTooltipProps {
  active?: boolean
  payload?: Array<{ dataKey: string; value?: number | null; color: string }>
  label?: string
  visible: string[]
  showAdOverlay: boolean
}

export function OverlayTooltip({
  active,
  payload,
  label,
  visible,
  showAdOverlay,
}: OverlayTooltipProps) {
  if (!active || !payload || !label) return null
  const [yyyy, mm, dd] = label.split('-')
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  const dateStr = isNaN(d.getTime())
    ? label
    : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  return (
    <div className="rounded-lg border bg-popover p-2 shadow-lg text-xs">
      <p className="font-medium mb-1">{dateStr}</p>
      {payload
        .filter(p => visible.includes(p.dataKey))
        .map(p => {
          const series = OVERLAY_SERIES.find(s => s.key === p.dataKey)
          const value =
            p.value == null
              ? 'Недоступно'
              : p.dataKey === 'adSpend' && showAdOverlay
                ? fmtCurrency(p.value)
                : p.value.toLocaleString('ru-RU')
          return (
            <div key={p.dataKey} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn('inline-block h-2.5 w-3.5 shrink-0', series?.markerClassName)}
                style={{ color: p.color }}
              />
              <span className="text-muted-foreground">{series?.label}:</span>
              <span className="font-medium">{value}</span>
              <span className="sr-only">{series?.markerLabel}</span>
            </div>
          )
        })}
    </div>
  )
}

export function ChartLegend({
  series,
  visible,
  onToggle,
}: {
  series: OverlaySeries[]
  visible: string[]
  onToggle: (key: string) => void
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Переключатели метрик">
      {series.map(s => {
        const isVisible = visible.includes(s.key)
        return (
          <Button
            key={s.key}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onToggle(s.key)}
            className={cn(
              'min-h-11 gap-1.5 px-3 py-1 text-xs transition-opacity',
              isVisible ? 'opacity-100' : 'opacity-40'
            )}
            aria-pressed={isVisible}
            aria-label={s.label}
            aria-describedby={`funnel-series-${s.key}-marker`}
          >
            <span
              aria-hidden="true"
              className={cn('inline-block h-2.5 w-3.5 shrink-0', s.markerClassName)}
              style={{ color: s.color }}
            />
            <span>{s.label}</span>
            <span id={`funnel-series-${s.key}-marker`} className="sr-only">
              {s.markerLabel}
            </span>
          </Button>
        )
      })}
    </div>
  )
}
