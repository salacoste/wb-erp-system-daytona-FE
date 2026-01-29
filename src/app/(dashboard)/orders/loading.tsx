/**
 * Orders Page Loading State
 * Story 40.3-FE: Orders List Page
 * Story 40.7-FE: Integration & Polish
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Enhanced Suspense fallback for orders page with filter and analytics skeletons.
 */

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { OrdersLoadingSkeleton } from '@/components/custom/orders'

export default function OrdersLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="mb-1 h-7 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Filters skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Date range filter skeleton */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-32" />
              <span className="text-muted-foreground">-</span>
              <Skeleton className="h-9 w-32" />
            </div>
            {/* Status filter skeleton */}
            <Skeleton className="h-9 w-36" />
            {/* WB Status filter skeleton */}
            <Skeleton className="h-9 w-36" />
            {/* Search skeleton */}
            <Skeleton className="h-9 w-48" />
            {/* Clear filters skeleton */}
            <Skeleton className="h-9 w-24" />
          </div>
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <OrdersLoadingSkeleton />

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
    </div>
  )
}
