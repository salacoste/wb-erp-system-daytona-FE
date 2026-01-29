/**
 * Backfill Admin Page Loading State
 * Story 51.11-FE: Backfill Admin Page
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 */

import { Skeleton } from '@/components/ui/skeleton'

export default function BackfillAdminLoading() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Page Header Skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Breadcrumb skeleton */}
          <Skeleton className="h-4 w-48 mb-2" data-testid="skeleton" />

          {/* Title skeleton */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded" data-testid="skeleton" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" data-testid="skeleton" />
              <Skeleton className="h-4 w-96" data-testid="skeleton" />
            </div>
          </div>
        </div>
      </div>

      {/* Page Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Action button skeleton */}
        <div className="mb-6 flex justify-between items-center">
          <Skeleton className="h-10 w-40" data-testid="skeleton" />
          <Skeleton className="h-4 w-32" data-testid="skeleton" />
        </div>

        {/* Table skeleton */}
        <div className="rounded-md border bg-white">
          <div className="p-4 space-y-4">
            {/* Table header */}
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" data-testid="skeleton" />
              <Skeleton className="h-4 w-20" data-testid="skeleton" />
              <Skeleton className="h-4 w-32" data-testid="skeleton" />
              <Skeleton className="h-4 w-16" data-testid="skeleton" />
              <Skeleton className="h-4 w-20" data-testid="skeleton" />
            </div>

            {/* Table rows */}
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-4 py-2">
                <Skeleton className="h-6 w-32" data-testid="skeleton" />
                <Skeleton className="h-6 w-20" data-testid="skeleton" />
                <Skeleton className="h-2 w-40" data-testid="skeleton" />
                <Skeleton className="h-6 w-16" data-testid="skeleton" />
                <Skeleton className="h-8 w-24" data-testid="skeleton" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
