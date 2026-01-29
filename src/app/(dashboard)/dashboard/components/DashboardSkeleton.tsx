/**
 * Dashboard Skeleton Component
 * Story 60.4-FE: Connect Dashboard to Period State
 *
 * Loading skeleton for dashboard page during Suspense fallback.
 */

'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-80" />
      </div>

      {/* Metric cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      {/* Advertising widget skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>

      {/* Chart skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-1 h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCardSkeleton(): React.ReactElement {
  return (
    <Card>
      <CardContent className="min-h-[120px] p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-8 w-40" />
        <Skeleton className="mt-1 h-4 w-24" />
      </CardContent>
    </Card>
  )
}
