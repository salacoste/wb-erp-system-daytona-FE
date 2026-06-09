'use client'

/**
 * ProductSearchSelect - Searchable dropdown for product selection
 * Story 44.26a-FE: Product Search & Delivery Date Selection
 * Backend: Epic 45 - Products Dimensions & Category API
 * Sub-components: ProductSearchPopover
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Package } from 'lucide-react'
import { logger } from '@/lib/logger'
import { useProductsWithDimensions } from '@/hooks/useProductsWithDimensions'
import { FieldTooltip } from './FieldTooltip'
import { useDebouncedSearch } from './useDebouncedSearch'
import { ProductSearchPopover } from './ProductSearchPopover'
import type { ProductWithDimensions } from '@/types/product'

export interface ProductSearchSelectProps {
  /** Selected product nm_id (STRING!) or null */
  value: string | null
  /** Callback when product is selected or cleared */
  onChange: (nmId: string | null, product: ProductWithDimensions | null) => void
  /** Display name for selected product */
  selectedProductName?: string
  /** Story 44.44: Initial nm_id from preset to auto-select after API loads */
  initialNmId?: string | null
  /** Disable the selector */
  disabled?: boolean
  /** Error message */
  error?: string
}

export function ProductSearchSelect({
  value,
  onChange,
  selectedProductName = '',
  initialNmId,
  disabled = false,
  error,
}: ProductSearchSelectProps) {
  const { searchInput, debouncedSearch, setSearchInput, setDebouncedSearch, clearSearch } =
    useDebouncedSearch(initialNmId ?? '')
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDimensions | null>(null)
  // Story 44.44: Track if preset product was restored
  const presetRestoredRef = useRef(false)

  // Story 44.44: Trigger search when initialNmId arrives after mount
  useEffect(() => {
    if (presetRestoredRef.current) return
    if (!initialNmId) return
    setDebouncedSearch(initialNmId)
  }, [initialNmId])

  const { data, isLoading, error: apiError, refetch } = useProductsWithDimensions(debouncedSearch)
  const products = data?.products ?? []

  // Story 44.44: Auto-select product from preset when API data loads
  useEffect(() => {
    if (presetRestoredRef.current) return
    if (!initialNmId || !products.length) return

    const product = products.find(p => p.nm_id === initialNmId)
    if (product) {
      presetRestoredRef.current = true
      logger.debug('[ProductSearchSelect] Restoring product from preset:', {
        nmId: initialNmId,
        name: product.sa_name,
      })
      setSelectedProduct(product)
      onChange(product.nm_id, product)
      setDebouncedSearch('')
    }
  }, [initialNmId, products, onChange])

  const handleSelect = useCallback(
    (product: ProductWithDimensions) => {
      setSelectedProduct(product)
      onChange(product.nm_id, product)
      clearSearch()
    },
    [onChange, clearSearch]
  )

  const handleClear = useCallback(() => {
    setSelectedProduct(null)
    onChange(null, null)
    clearSearch()
  }, [onChange, clearSearch])

  const displayName = selectedProductName || selectedProduct?.sa_name || ''

  // Loading skeleton
  if (disabled && !value) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="flex-1">Товар (опционально)</Label>
          <FieldTooltip content="Выберите товар для автозаполнения габаритов и категории" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="flex-1">Товар (опционально)</Label>
        <FieldTooltip content="Выберите товар для автозаполнения габаритов и категории" />
      </div>

      <ProductSearchPopover
        value={value}
        displayName={displayName}
        searchInput={searchInput}
        disabled={disabled}
        error={error}
        selectedProduct={selectedProduct}
        products={products}
        isLoading={isLoading}
        hasSearch={debouncedSearch.length >= 2}
        apiError={apiError}
        onSearchInput={setSearchInput}
        onSelect={handleSelect}
        onClear={handleClear}
        onRetry={refetch}
      />

      {!value && (
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5" />
          Или введите данные вручную ниже
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
