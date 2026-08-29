/**
 * Backfill Admin Page Loading State
 * Story 51.11-FE: Backfill Admin Page
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 */

import { Skeleton } from '@/components/ui/skeleton'

export default function BackfillAdminLoading() {
  return (
    <section className="space-y-6 py-2" aria-busy="true" aria-label="Загрузка страницы бэкфилла">
      <div className="space-y-3">
        <Skeleton className="h-4 w-48 motion-reduce:animate-none" data-testid="skeleton" />
        <Skeleton
          className="h-8 w-64 max-w-full motion-reduce:animate-none"
          data-testid="skeleton"
        />
        <Skeleton
          className="h-4 w-96 max-w-full motion-reduce:animate-none"
          data-testid="skeleton"
        />
      </div>

      <Skeleton className="h-24 w-full motion-reduce:animate-none" data-testid="skeleton" />

      <div className="rounded-md border bg-card p-4">
        <div className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24 motion-reduce:animate-none" data-testid="skeleton" />
            <Skeleton className="h-4 w-20 motion-reduce:animate-none" data-testid="skeleton" />
            <Skeleton className="h-4 w-32 motion-reduce:animate-none" data-testid="skeleton" />
            <Skeleton className="h-4 w-16 motion-reduce:animate-none" data-testid="skeleton" />
          </div>

          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-4 py-2">
              <Skeleton className="h-6 w-32 motion-reduce:animate-none" data-testid="skeleton" />
              <Skeleton className="h-6 w-20 motion-reduce:animate-none" data-testid="skeleton" />
              <Skeleton className="h-2 w-40 motion-reduce:animate-none" data-testid="skeleton" />
              <Skeleton className="h-8 w-24 motion-reduce:animate-none" data-testid="skeleton" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
