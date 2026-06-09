'use client'

/**
 * Product Search Popover - Combobox UI for product search
 * Extracted from ProductSearchSelect.tsx for file size compliance
 */

import React, { useState, useCallback } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandInput, CommandList } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Search, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SelectedProductCard, ProductSearchResults } from './ProductSearchComponents'
import type { ProductWithDimensions } from '@/types/product'

const MAX_VISIBLE_RESULTS = 50

interface ProductSearchPopoverProps {
  value: string | null
  displayName: string
  searchInput: string
  disabled: boolean
  error?: string
  selectedProduct: ProductWithDimensions | null
  products: ProductWithDimensions[]
  isLoading: boolean
  hasSearch: boolean
  apiError: Error | null
  onSearchInput: (value: string) => void
  onSelect: (product: ProductWithDimensions) => void
  onClear: () => void
  onRetry: () => void
}

export function ProductSearchPopover({
  value,
  displayName,
  searchInput,
  disabled,
  error,
  selectedProduct,
  products,
  isLoading,
  hasSearch,
  apiError,
  onSearchInput,
  onSelect,
  onClear,
  onRetry,
}: ProductSearchPopoverProps): React.ReactElement {
  const [open, setOpen] = useState(false)

  const handleSelect = useCallback(
    (product: ProductWithDimensions) => {
      onSelect(product)
      setOpen(false)
    },
    [onSelect]
  )

  if (value && displayName) {
    return (
      <SelectedProductCard
        nmId={value}
        name={displayName}
        product={selectedProduct}
        onClear={onClear}
        disabled={disabled}
      />
    )
  }

  return (
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
            onValueChange={onSearchInput}
          />
          <CommandList>
            <ProductSearchResults
              products={products.slice(0, MAX_VISIBLE_RESULTS)}
              isLoading={isLoading}
              hasSearch={hasSearch}
              apiError={apiError}
              onSelect={handleSelect}
              onRetry={onRetry}
            />
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
