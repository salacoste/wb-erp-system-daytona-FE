'use client'

/**
 * ProductSearchSelect Sub-components
 * Story 44.26a-FE: Product Search & Delivery Date Selection
 * Story 44.26b-FE: Auto-fill Dimensions & Category Display
 * Extracted for 200-line file limit compliance
 */

import { Button } from '@/components/ui/button'
import { X, Package, Ruler, FolderTree } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProductWithDimensions } from '@/types/product'
import { formatDimensionsDisplay, formatCategoryDisplay } from './product-search-helpers'

// Re-export helpers and ProductSearchResults for backward compatibility
export { formatDimensionsDisplay, formatCategoryDisplay } from './product-search-helpers'
export { ProductSearchResults } from './ProductSearchResults'

interface ProductThumbnailProps {
  photoUrl?: string
  size?: 'sm' | 'md'
}

export function ProductThumbnail({ photoUrl, size = 'md' }: ProductThumbnailProps) {
  const sizeClass = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  if (!photoUrl) {
    return (
      <div className={cn(sizeClass, 'rounded bg-muted flex items-center justify-center shrink-0')}>
        <Package className="h-4 w-4 text-muted-foreground" />
      </div>
    )
  }
  return (
    <img
      src={photoUrl}
      alt=""
      className={cn(sizeClass, 'rounded object-cover shrink-0')}
      onError={e => {
        ;(e.target as HTMLImageElement).style.display = 'none'
      }}
    />
  )
}

interface SelectedProductCardProps {
  nmId: string
  name: string
  product: ProductWithDimensions | null
  onClear: () => void
  disabled: boolean
}

export function SelectedProductCard({
  nmId,
  name,
  product,
  onClear,
  disabled,
}: SelectedProductCardProps) {
  const dimensionsText = product ? formatDimensionsDisplay(product) : null
  const categoryText = product ? formatCategoryDisplay(product) : null

  return (
    <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/30">
      <ProductThumbnail photoUrl={product?.photo_url} />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {name} {product?.vendor_code && `(${product.vendor_code})`}
        </p>
        <p className="text-sm text-muted-foreground">
          {product?.brand && `${product.brand} • `}nmId: {nmId}
        </p>
        {(dimensionsText || categoryText) && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
            {dimensionsText && (
              <span className="inline-flex items-center gap-1">
                <Ruler className="h-3 w-3" aria-hidden="true" />
                {dimensionsText}
              </span>
            )}
            {categoryText && (
              <span className="inline-flex items-center gap-1">
                <FolderTree className="h-3 w-3" aria-hidden="true" />
                {categoryText}
              </span>
            )}
          </p>
        )}
      </div>
      {!disabled && (
        <Button type="button" variant="ghost" size="sm" onClick={onClear} className="shrink-0">
          <X className="h-4 w-4 mr-1" />
          Очистить
        </Button>
      )}
    </div>
  )
}
