'use client'

/**
 * Daily Trend Chart — Legend Toggle
 * Extracted from DailyTrendChart for max-lines compliance
 */

import { cn } from '@/lib/utils'
import { DAILY_TREND_SERIES } from './daily-trend-config'

interface DailyTrendLegendProps {
  visibleSeries: string[]
  onToggle: (key: string) => void
}

/**
 * Toggleable legend for daily trend chart metrics.
 * Each button toggles visibility of its corresponding line series.
 */
export function DailyTrendLegend({ visibleSeries, onToggle }: DailyTrendLegendProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-3" role="group" aria-label="Переключатели метрик">
      {DAILY_TREND_SERIES.map(series => {
        const isVisible = visibleSeries.includes(series.key)
        return (
          <button
            key={series.key}
            onClick={() => onToggle(series.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-opacity',
              isVisible ? 'opacity-100' : 'opacity-40'
            )}
            aria-pressed={isVisible}
            aria-label={`${isVisible ? 'Скрыть' : 'Показать'} ${series.label}`}
          >
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: series.color }} />
            <span>{series.label}</span>
          </button>
        )
      })}
    </div>
  )
}
