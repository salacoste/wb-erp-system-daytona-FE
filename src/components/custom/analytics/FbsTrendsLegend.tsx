/**
 * FbsTrendsLegend Component
 * Story 51.4-FE: FBS Trends Chart
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Interactive legend with toggle buttons for each metric.
 * Supports keyboard navigation and accessibility.
 */

import { cn } from '@/lib/utils'
import { CHART_LINE_COLORS, METRIC_LABELS, type MetricVisibility } from '@/lib/fbs-analytics-utils'

// ============================================================================
// Component Props
// ============================================================================

interface FbsTrendsLegendProps {
  /** Current visibility state */
  visibility: MetricVisibility
  /** Callback when metric is toggled */
  onToggle: (metric: keyof MetricVisibility) => void
  /** Additional class names */
  className?: string
}

// ============================================================================
// Legend Item Component
// ============================================================================

interface LegendItemProps {
  metric: keyof MetricVisibility
  label: string
  color: string
  isVisible: boolean
  onToggle: () => void
}

function LegendItem({ metric, label, color, isVisible, onToggle }: LegendItemProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm',
        'border border-gray-200',
        'transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
        isVisible ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 opacity-60 hover:opacity-80'
      )}
      aria-pressed={isVisible}
      aria-label={`${label}: ${isVisible ? 'показать' : 'скрыть'}`}
      data-metric={metric}
    >
      {/* Color indicator */}
      <span
        className={cn(
          'w-3 h-3 rounded-full border',
          isVisible ? 'border-transparent' : 'border-gray-400'
        )}
        style={{
          backgroundColor: isVisible ? color : 'transparent',
        }}
      />
      {/* Label */}
      <span className={cn('font-medium', isVisible ? 'text-gray-900' : 'text-gray-500')}>
        {label}
      </span>
    </button>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Interactive legend for FBS Trends chart
 * Allows toggling visibility of each metric
 *
 * @example
 * <FbsTrendsLegend
 *   visibility={{ orders: true, revenue: true, cancellations: false }}
 *   onToggle={(metric) => handleToggle(metric)}
 * />
 */
export function FbsTrendsLegend({ visibility, onToggle, className }: FbsTrendsLegendProps) {
  const metrics: (keyof MetricVisibility)[] = ['orders', 'revenue', 'cancellations']

  return (
    <div
      className={cn('flex flex-wrap gap-2', className)}
      role="group"
      aria-label="Управление отображением метрик"
    >
      {metrics.map(metric => (
        <LegendItem
          key={metric}
          metric={metric}
          label={METRIC_LABELS[metric]}
          color={CHART_LINE_COLORS[metric]}
          isVisible={visibility[metric]}
          onToggle={() => onToggle(metric)}
        />
      ))}
    </div>
  )
}
