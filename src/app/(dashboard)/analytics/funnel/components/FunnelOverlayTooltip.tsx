/**
 * Funnel Overlay Chart Sub-Components — Story 73.8-FE
 * Tooltip and legend for the overlay chart.
 */

import { cn } from '@/lib/utils'
import { OVERLAY_SERIES, fmtCurrency, type OverlaySeries } from './funnel-overlay-config'

interface OverlayTooltipProps {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number; color: string }>
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
    <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
      <p className="font-medium mb-1">{dateStr}</p>
      {payload
        .filter(p => visible.includes(p.dataKey))
        .map(p => {
          const series = OVERLAY_SERIES.find(s => s.key === p.dataKey)
          const value =
            p.dataKey === 'adSpend' && showAdOverlay
              ? fmtCurrency(p.value ?? 0)
              : (p.value ?? 0).toLocaleString('ru-RU')
          return (
            <div key={p.dataKey} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-muted-foreground">{series?.label}:</span>
              <span className="font-medium">{value}</span>
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
          <button
            key={s.key}
            onClick={() => onToggle(s.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-opacity',
              isVisible ? 'opacity-100' : 'opacity-40'
            )}
            aria-pressed={isVisible}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span>{s.label}</span>
          </button>
        )
      })}
    </div>
  )
}
