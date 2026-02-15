/**
 * Dashboard Metrics Grid Skeleton Component
 * Story 62.1-FE: Redesign Dashboard Metrics Grid
 * Epic 62-FE: Dashboard UI/UX Presentation
 *
 * Loading skeleton for the 8-card metrics grid.
 *
 * @see docs/stories/epic-62/story-62.1-fe-redesign-dashboard-metrics-grid.md
 */

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface MetricCardSkeletonProps {
  className?: string
}

/**
 * Single metric card skeleton
 * Matches the layout of actual metric cards for smooth loading transitions
 */
export function MetricCardSkeleton({ className }: MetricCardSkeletonProps): React.ReactElement {
  return (
    <Card className={cn('min-h-[120px]', className)} aria-hidden="true">
      <CardContent className="p-4">
        {/* Header: icon + title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-4 rounded" />
        </div>

        {/* Main value */}
        <Skeleton className="mt-2 h-8 w-32" />

        {/* Comparison row */}
        <div className="mt-2 flex items-center gap-2">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Subtitle */}
        <Skeleton className="mt-1 h-3 w-16" />
      </CardContent>
    </Card>
  )
}

/**
 * Grid classes matching DashboardMetricsGrid
 */
const gridClasses = cn(
  'grid gap-4 items-stretch',
  'grid-cols-1', // Mobile: 1 column
  'md:grid-cols-2', // Tablet: 2 columns
  'xl:grid-cols-3' // Desktop: 3 columns (Story 65.17)
)

export interface DashboardMetricsGridSkeletonProps {
  /** Number of skeleton cards to display (default: 8) */
  cardCount?: number
  className?: string
}

/**
 * Full grid skeleton for dashboard metrics
 * Shows 8 loading cards in responsive grid layout
 */
export function DashboardMetricsGridSkeleton({
  cardCount = 8,
  className,
}: DashboardMetricsGridSkeletonProps): React.ReactElement {
  return (
    <div
      className={cn(gridClasses, className)}
      role="region"
      aria-label="Загрузка метрик"
      aria-busy="true"
    >
      {Array.from({ length: cardCount }).map((_, index) => (
        <MetricCardSkeleton key={index} />
      ))}
    </div>
  )
}
