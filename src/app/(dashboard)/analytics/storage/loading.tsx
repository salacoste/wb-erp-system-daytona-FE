import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * Loading skeleton for Storage Analytics page
 * Story 24.2-FE: Storage Analytics Page Layout
 */
export default function StorageAnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-64" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-80" />
              <Skeleton className="h-4 w-60" />
            </div>
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/30 rounded-lg border">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-9 w-36" />
        </div>
        <Skeleton className="h-9 w-4" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trends Chart Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>

      {/* Top Consumers Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>

      {/* Table Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
