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
      className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center"
    >
      <Package className="mb-4 h-12 w-12 text-gray-400" />
      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        Товары не найдены
      </h3>
      <p className="text-sm text-gray-500">
        {hasSearchQuery
          ? 'Попробуйте изменить условия поиска'
          : 'В этой категории пока нет товаров'}
      </p>
    </div>
  )
}

export default ProductEmptyState
