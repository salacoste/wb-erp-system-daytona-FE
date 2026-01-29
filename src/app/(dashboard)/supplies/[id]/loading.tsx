/**
 * Loading state for Supply Detail Page
 * Story 53.4-FE: Supply Detail Page
 * Epic 53-FE: Supply Management UI
 */

import { Skeleton } from '@/components/ui/skeleton'

export default function SupplyDetailLoading() {
  return (
    <div className="container py-6">
      <div className="space-y-6">
        {/* Back link skeleton */}
        <Skeleton className="h-5 w-32" />

        {/* Header skeleton */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>

        {/* Stepper skeleton */}
        <Skeleton className="h-24 w-full" />

        {/* Table header */}
        <Skeleton className="h-6 w-48" />

        {/* Table skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  )
}
