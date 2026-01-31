/**
 * Trends Chart Skeleton Component
 * Story 63.12-FE: Historical Trends Dashboard Section
 *
 * Loading skeleton for the trends chart section.
 *
 * @see docs/stories/epic-63/story-63.12-fe-historical-trends-section.md
 */

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface TrendsChartSkeletonProps {
  className?: string
}

/**
 * Loading skeleton for trends chart and summary
 */
export function TrendsChartSkeleton({ className }: TrendsChartSkeletonProps): React.ReactElement {
  return (
    <div className={cn('animate-pulse', className)} aria-busy="true" aria-label="Загрузка графика">
      {/* Chart area skeleton */}
      <div className="h-[300px] w-full rounded-md bg-gray-100">
        <div className="flex h-full flex-col justify-end p-4">
          {/* Fake chart lines */}
          <div className="flex items-end gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gray-200"
                style={{ height: `${20 + Math.random() * 60}%` }}
              />
            ))}
          </div>
          {/* X-axis labels */}
          <div className="mt-2 flex justify-between">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-8" />
            ))}
          </div>
        </div>
      </div>

      {/* Legend skeleton */}
      <div className="mt-4 flex flex-wrap gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>

      {/* Summary grid skeleton */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-md border p-3">
            <Skeleton className="mb-2 h-4 w-20" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <Skeleton className="mt-2 h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
