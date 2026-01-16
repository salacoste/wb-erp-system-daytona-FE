'use client'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * Loading skeleton for ProductList
 * Extracted from ProductList.tsx for better maintainability
 */
export function ProductLoadingSkeleton(): React.ReactElement {
  return (
    <div data-testid="product-loading-skeleton" className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}

export default ProductLoadingSkeleton
