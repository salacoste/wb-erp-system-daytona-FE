/**
 * Trends Legend Component
 * Story 63.12-FE: Historical Trends Dashboard Section
 *
 * Interactive legend with checkboxes to toggle metric visibility.
 *
 * @see docs/stories/epic-63/story-63.12-fe-historical-trends-section.md
 */

'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TRENDS_METRICS, type TrendsMetricKey } from './trends-config'

export interface TrendsLegendProps {
  /** Set of currently visible metrics */
  visibleMetrics: Set<TrendsMetricKey>
  /** Callback when a metric is toggled */
  onToggle: (metric: TrendsMetricKey) => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Interactive legend with metric toggles
 */
export function TrendsLegend({
  visibleMetrics,
  onToggle,
  className,
}: TrendsLegendProps): React.ReactElement {
  return (
    <div role="group" aria-label="Выбор метрик" className={cn('flex flex-wrap gap-4', className)}>
      {TRENDS_METRICS.map(metric => {
        const isVisible = visibleMetrics.has(metric.key)
        const isLastVisible = isVisible && visibleMetrics.size === 1

        return (
          <button
            key={metric.key}
            role="checkbox"
            aria-checked={isVisible}
            aria-label={`${isVisible ? 'Скрыть' : 'Показать'} ${metric.label}`}
            disabled={isLastVisible}
            onClick={() => onToggle(metric.key)}
            className={cn(
              'inline-flex items-center gap-2 rounded px-2 py-1',
              'text-sm transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isVisible ? 'text-foreground' : 'text-muted-foreground opacity-60',
              isLastVisible && 'cursor-not-allowed'
            )}
          >
            {/* Checkbox indicator */}
            <span
              className={cn(
                'flex h-4 w-4 items-center justify-center rounded border',
                isVisible ? 'border-transparent' : 'border-gray-300 bg-white'
              )}
              style={{ backgroundColor: isVisible ? metric.color : undefined }}
            >
              {isVisible && <Check className="h-3 w-3 text-white" />}
            </span>

            {/* Color line indicator */}
            <span
              className="h-0.5 w-4 rounded"
              style={{ backgroundColor: metric.color }}
              aria-hidden="true"
            />

            {/* Label */}
            <span>{metric.label}</span>
          </button>
        )
      })}
    </div>
  )
}
