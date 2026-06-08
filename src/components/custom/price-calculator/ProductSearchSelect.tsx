'use client'

/**
 * ProductSearchSelect - Searchable dropdown for product selection
 * Story 44.26a-FE: Product Search & Delivery Date Selection
 * Backend: Epic 45 - Products Dimensions & Category API
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandInput, CommandList } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Package, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { useProductsWithDimensions } from '@/hooks/useProductsWithDimensions'
import { FieldTooltip } from './FieldTooltip'
import { SelectedProductCard, ProductSearchResults } from './ProductSearchComponents'
import { useDebouncedSearch } from './useDebouncedSearch'
import type { ProductWithDimensions } from '@/types/product'

const MAX_VISIBLE_RESULTS = 50

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
  const [open, setOpen] = useState(false)
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
      setOpen(false)
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

      {value && displayName ? (
        <SelectedProductCard
          nmId={value}
          name={displayName}
          product={selectedProduct}
          onClear={handleClear}
          disabled={disabled}
        />
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label="Поиск товара"
              disabled={disabled}
              className={cn(
                'w-full justify-between font-normal text-muted-foreground',
                error && 'border-destructive'
              )}
            >
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Поиск по SKU, артикулу или названию...
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Поиск по SKU, артикулу или названию..."
                value={searchInput}
                onValueChange={setSearchInput}
              />
              <CommandList>
                <ProductSearchResults
                  products={products.slice(0, MAX_VISIBLE_RESULTS)}
                  isLoading={isLoading}
                  hasSearch={debouncedSearch.length >= 2}
                  apiError={apiError}
                  onSelect={handleSelect}
                  onRetry={refetch}
                />
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

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
