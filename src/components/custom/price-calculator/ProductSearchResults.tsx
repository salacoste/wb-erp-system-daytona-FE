'use client'

/**
 * ProductSearchResults Component
 * Extracted from ProductSearchComponents.tsx for file-size compliance.
 * Story 44.26a-FE: Product Search & Delivery Date Selection
 */

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { AlertCircle } from 'lucide-react'
import type { ProductWithDimensions } from '@/types/product'
import { ProductThumbnail } from './ProductSearchComponents'
import { formatDimensionsDisplay, formatCategoryDisplay } from './product-search-helpers'

interface ProductSearchResultsProps {
  products: ProductWithDimensions[]
  isLoading: boolean
  hasSearch: boolean
  apiError: Error | null
  onSelect: (product: ProductWithDimensions) => void
  onRetry: () => void
}

export function ProductSearchResults({
  products,
  isLoading,
  hasSearch,
  apiError,
  onSelect,
  onRetry,
}: ProductSearchResultsProps) {
  if (apiError) {
    return (
      <div className="flex items-center gap-2 p-3 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        <span className="flex-1">Ошибка поиска</span>
        <Button type="button" variant="outline" size="sm" onClick={() => onRetry()}>
          Повторить
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-2 space-y-2">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (!hasSearch) {
    return <CommandEmpty>Введите минимум 2 символа для поиска</CommandEmpty>
  }

  if (products.length === 0) {
    return <CommandEmpty>Товары не найдены</CommandEmpty>
  }

  return (
    <CommandGroup>
      {products.map(product => {
        const dimensionsText = formatDimensionsDisplay(product)
        const categoryText = formatCategoryDisplay(product)
        return (
          <CommandItem
            key={product.nm_id}
            value={product.nm_id}
            onSelect={() => onSelect(product)}
            className="cursor-pointer"
          >
            <ProductThumbnail photoUrl={product.photo_url} size="sm" />
            <div className="flex-1 min-w-0 ml-2">
              <p className="text-sm font-medium truncate">
                {product.nm_id} • {product.vendor_code}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {product.sa_name}
                {product.brand && ` - ${product.brand}`}
              </p>
              {(dimensionsText || categoryText) && (
                <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                  {dimensionsText && <span>📐 {dimensionsText}</span>}
                  {dimensionsText && categoryText && ' • '}
                  {categoryText ?? (!dimensionsText ? null : 'Категория не указана')}
                </p>
              )}
            </div>
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}
