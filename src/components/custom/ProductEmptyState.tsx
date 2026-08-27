'use client'

import { Package } from 'lucide-react'

export interface ProductEmptyStateProps {
  hasSearchQuery: boolean
}

/**
 * Empty state display for ProductList when no products found
 * Extracted from ProductList.tsx for better maintainability
 */
export function ProductEmptyState({ hasSearchQuery }: ProductEmptyStateProps): React.ReactElement {
  return (
    <div
      data-testid="product-empty-state"
      className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted p-12 text-center"
    >
      <Package className="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-semibold text-foreground">Товары не найдены</h3>
      <p className="text-sm text-muted-foreground">
        {hasSearchQuery
          ? 'Попробуйте изменить условия поиска'
          : 'В этой категории пока нет товаров'}
      </p>
    </div>
  )
}

export default ProductEmptyState
