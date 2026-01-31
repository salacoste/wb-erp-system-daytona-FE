/**
 * Period Comparison Section Skeleton
 * Story 63.11-FE: WoW/MoM Period Comparison Cards
 *
 * Loading skeleton for the entire comparison section.
 *
 * @see docs/stories/epic-63/story-63.11-fe-period-comparison-cards.md
 */

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface PeriodComparisonSkeletonProps {
  className?: string
}

/**
 * Single card skeleton
 */
function CardSkeleton(): React.ReactElement {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="mt-3 h-7 w-32" />
        <div className="mt-2 flex items-center gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Full section skeleton matching the comparison cards layout
 */
export function PeriodComparisonSkeleton({
  className,
}: PeriodComparisonSkeletonProps): React.ReactElement {
  return (
    <section aria-label="Загрузка сравнения периодов" aria-busy="true" className={className}>
      {/* Header skeleton */}
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-28" />
      </div>

      {/* Grid skeleton - matches actual layout */}
      <div className={cn('grid gap-4', 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4')}>
        {/* Top row: 4 cards */}
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Bottom row: 2 cards (expense metrics) */}
      <div className={cn('mt-4 grid gap-4', 'grid-cols-1 md:grid-cols-2')}>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </section>
  )
}
