'use client'

/**
 * MetricLegend Component
 * Story 62.7-FE: Interactive Chart Legend
 *
 * Interactive legend for toggling chart metric visibility.
 * Features click-to-toggle, keyboard accessibility, and action buttons.
 *
 * @see docs/stories/epic-62/story-62.7-fe-interactive-chart-legend.md
 */

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { METRIC_SERIES, type MetricKey } from './chart-config'

// ============================================================================
// Component Props
// ============================================================================

interface MetricLegendProps {
  /** Array of visible series keys */
  visibleSeries: string[]
  /** Callback when a series is toggled */
  onSeriesToggle: (key: string) => void
  /** Callback to show all series */
  onShowAll: () => void
  /** Callback to hide all series (keeps at least 1) */
  onHideAll: () => void
  /** Additional class names */
  className?: string
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Interactive legend for Daily Breakdown chart
 * Allows toggling visibility of each metric
 *
 * @example
 * <MetricLegend
 *   visibleSeries={['orders', 'sales']}
 *   onSeriesToggle={(key) => toggle(key)}
 *   onShowAll={() => showAll()}
 *   onHideAll={() => hideAll()}
 * />
 */
export function MetricLegend({
  visibleSeries,
  onSeriesToggle,
  onShowAll,
  onHideAll,
  className,
}: MetricLegendProps) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-4', className)}
      role="group"
      aria-label="Управление отображением метрик"
    >
      {/* Legend Items - horizontal scroll on mobile */}
      <div className="relative flex flex-1 items-center gap-3 overflow-x-auto scrollbar-none md:flex-wrap">
        {/* Gradient fade for mobile scroll indication */}
        <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-8 bg-gradient-to-l from-white to-transparent md:hidden" />

        {METRIC_SERIES.map(item => (
          <LegendItem
            key={item.key}
            metricKey={item.key}
            label={item.label}
            color={item.color}
            isVisible={visibleSeries.includes(item.key)}
            onToggle={() => onSeriesToggle(item.key)}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="outline" size="sm" onClick={onShowAll} className="text-xs">
          Все
        </Button>
        <Button variant="outline" size="sm" onClick={onHideAll} className="text-xs">
          Сбросить
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Legend Item Subcomponent
// ============================================================================

interface LegendItemProps {
  metricKey: MetricKey
  label: string
  color: string
  isVisible: boolean
  onToggle: () => void
}

function LegendItem({ metricKey, label, color, isVisible, onToggle }: LegendItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle()
    }
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isVisible}
      aria-label={`${isVisible ? 'Скрыть' : 'Показать'} ${label} на графике`}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex shrink-0 cursor-pointer items-center gap-1.5 transition-opacity',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'focus-visible:ring-offset-2 focus-visible:rounded',
        !isVisible && 'opacity-60'
      )}
      data-metric={metricKey}
    >
      {/* Color dot indicator */}
      <span
        className="h-3 w-3 rounded-full"
        style={{
          backgroundColor: isVisible ? color : '#9CA3AF',
        }}
      />
      {/* Label */}
      <span
        className={cn(
          'text-sm hover:underline',
          isVisible ? 'text-gray-700' : 'text-gray-400 line-through'
        )}
      >
        {label}
      </span>
    </button>
  )
}

// ============================================================================
// Exports
// ============================================================================

export type { MetricLegendProps }
