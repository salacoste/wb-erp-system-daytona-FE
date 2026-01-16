import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * Loading skeleton for Advertising Analytics page
 * Story 33.2-FE: Advertising Analytics Page Layout
 * Epic 33: Advertising Analytics (Frontend)
 */
export default function AdvertisingAnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-64" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-7 w-64" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/30 rounded-lg border">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-9 w-36" />
        </div>
        <Skeleton className="h-9 w-4" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="ml-auto">
          <Skeleton className="h-9 w-80" />
        </div>
      </div>

      {/* Summary Cards Skeleton (4 cards) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-16 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
