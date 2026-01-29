/**
 * Supplies Loading Page
 * Story 53.2-FE: Supplies List Page
 * Epic 53-FE: Supply Management UI
 *
 * Loading skeleton displayed during page navigation.
 */

import { SuppliesLoadingSkeleton } from '@/components/custom/supplies'
import { Package } from 'lucide-react'

export default function SuppliesLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Поставки FBS</h1>
            <p className="text-sm text-muted-foreground">
              Управление поставками и отслеживание статусов
            </p>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <SuppliesLoadingSkeleton />
    </div>
  )
}
