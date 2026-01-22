'use client'

/**
 * ProductSearchSelect Sub-components
 * Story 44.26a-FE: Product Search & Delivery Date Selection
 * Story 44.26b-FE: Auto-fill Dimensions & Category Display
 * Extracted for 200-line file limit compliance
 */

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { X, Package, AlertCircle, Ruler, FolderTree } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProductWithDimensions } from '@/types/product'
import { mmToCm } from '@/lib/dimension-utils'

interface ProductThumbnailProps { photoUrl?: string; size?: 'sm' | 'md' }

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
    <img src={photoUrl} alt="" className={cn(sizeClass, 'rounded object-cover shrink-0')}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
  )
}

interface SelectedProductCardProps {
  nmId: string; name: string; product: ProductWithDimensions | null; onClear: () => void; disabled: boolean
}

/** Format dimensions for display: "40×30×5 см (6.0 л)" */
function formatDimensionsDisplay(product: ProductWithDimensions): string | null {
  if (!product.dimensions) return null
  const l = mmToCm(product.dimensions.length_mm)
  const w = mmToCm(product.dimensions.width_mm)
  const h = mmToCm(product.dimensions.height_mm)
  const vol = product.dimensions.volume_liters.toFixed(1)
  return `${l}×${w}×${h} см (${vol} л)`
}

/** Format category for display: "Женская одежда → Платья" */
function formatCategoryDisplay(product: ProductWithDimensions): string | null {
  if (!product.category_hierarchy) return null
  const { parent_name, subject_name } = product.category_hierarchy
  return parent_name ? `${parent_name} → ${subject_name}` : subject_name
}

export function SelectedProductCard({ nmId, name, product, onClear, disabled }: SelectedProductCardProps) {
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

// ============================================================================
// ProductSearchResults
// ============================================================================

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
        {[1, 2, 3].map((i) => (
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
      {products.map((product) => {
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
