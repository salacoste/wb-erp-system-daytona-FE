'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Loading skeleton for liquidity page
 * Story 7.2: Liquidity Page Structure
 */
export function LiquidityLoading() {
  return (
    <div className="space-y-6">
      {/* Distribution Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16 mb-2" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-3 w-28 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Bar Skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Benchmarks Skeleton */}
      <Card>
        <CardContent className="p-4 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Table Skeleton */}
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
