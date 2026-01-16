'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Loading Skeleton for Supply Planning Page
 * Story 6.2: Page Structure & Risk Dashboard
 * UX Specs by Sally (2025-12-12)
 *
 * Shows skeleton loaders for 5 risk cards and metrics bar.
 */

export function SupplyPlanningLoading() {
  return (
    <div className="space-y-6">
      {/* Risk Cards Skeleton (5 cards) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="min-h-[140px]">
            <CardContent className="p-5">
              {/* Header skeleton */}
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>

              {/* Count skeleton */}
              <Skeleton className="h-9 w-20 mb-2" />

              {/* Loss skeleton */}
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Metrics Bar Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-gray-50 p-4">
        {/* Metric 1 */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>

        {/* Separator */}
        <div className="hidden sm:block h-10 w-px bg-gray-300" />

        {/* Metric 2 */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-6 w-36" />
          </div>
        </div>

        {/* Separator */}
        <div className="hidden sm:block h-10 w-px bg-gray-300" />

        {/* Metric 3 */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>

      {/* Table placeholder skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Table header */}
            <div className="flex gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
              ))}
            </div>

            {/* Table rows */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton key={j} className="h-8 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
