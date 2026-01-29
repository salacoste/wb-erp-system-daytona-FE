/**
 * Modal Loading Skeleton Component
 * Story 40.4-FE: Order Details Modal
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Skeleton loader for modal content during data fetch.
 * Matches structure of OrderModalHeader and tabs.
 */

import { Skeleton } from '@/components/ui/skeleton'

export interface ModalLoadingSkeletonProps {
  'data-testid'?: string
}

/**
 * Skeleton loader for modal - shows placeholder while loading order details
 * Accessible via aria-busy on parent container
 */
export function ModalLoadingSkeleton(props: ModalLoadingSkeletonProps) {
  return (
    <div data-testid={props['data-testid']} data-skeleton className="space-y-4">
      {/* Header Skeleton */}
      <div className="flex gap-4 pb-4 border-b">
        {/* Image placeholder */}
        <Skeleton className="w-16 h-16 rounded-md flex-shrink-0" />

        {/* Info skeleton */}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>

        {/* Right column skeleton */}
        <div className="flex-shrink-0 space-y-2 text-right">
          <Skeleton className="h-4 w-32 ml-auto" />
          <Skeleton className="h-3 w-20 ml-auto" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        {/* Tab buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-9 rounded-md" />
          <Skeleton className="h-9 rounded-md" />
          <Skeleton className="h-9 rounded-md" />
        </div>

        {/* Tab content skeleton (timeline entries) */}
        <TimelineEntrySkeleton />
        <TimelineEntrySkeleton />
        <TimelineEntrySkeleton />
      </div>
    </div>
  )
}

/**
 * Single timeline entry skeleton
 */
function TimelineEntrySkeleton() {
  return (
    <div className="flex gap-3 py-2">
      <Skeleton className="w-3 h-3 rounded-full mt-1" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-5 w-12 flex-shrink-0" />
    </div>
  )
}
