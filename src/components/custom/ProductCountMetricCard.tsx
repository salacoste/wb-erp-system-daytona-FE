/**
 * Product Count Metric Card Component
 * Story 60.5-FE: Remove Data Duplication
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * Displays product count in main dashboard metric grid.
 * Moved from InitialDataSummary to eliminate duplicate displays.
 *
 * @see docs/stories/epic-60/story-60.5-fe-remove-data-duplication.md
 */

'use client'

import { Package } from 'lucide-react'
import { MetricCardEnhanced } from './MetricCardEnhanced'

export interface ProductCountMetricCardProps {
  /** Total number of products in cabinet */
  count: number | null | undefined
  /** Previous period count for comparison (optional) */
  previousCount?: number | null
  /** Loading state */
  isLoading?: boolean
  /** Error message */
  error?: string | null
  /** Tooltip text */
  tooltip?: string
  /** Additional class names */
  className?: string
}

/**
 * Product count metric card for dashboard grid
 * Uses MetricCardEnhanced for consistent styling with comparison indicators
 */
export function ProductCountMetricCard({
  count,
  previousCount,
  isLoading = false,
  error = null,
  tooltip = 'Общее количество товаров в кабинете',
  className,
}: ProductCountMetricCardProps): React.ReactElement {
  return (
    <MetricCardEnhanced
      title="Товаров"
      value={count}
      previousValue={previousCount}
      format="number"
      icon={Package}
      tooltip={tooltip}
      isLoading={isLoading}
      error={error}
      className={className}
      data-testid="product-count-metric-card"
    />
  )
}
