'use client'

import { useState, useMemo, useCallback } from 'react'
import type { BulkCogsProduct } from './bulk-cogs.types'

/**
 * Custom hook for product selection state management in bulk COGS form
 * Story 4.2: Bulk COGS Assignment Capability
 *
 * Handles individual/all selection and derived state
 * (selected details, all-visible check).
 *
 * @param products - Current page products (may be undefined during loading)
 */
export function useBulkCogsSelection(products: BulkCogsProduct[] | undefined) {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())

  /** Get full details of selected products from current page */
  const selectedProductDetails = useMemo(() => {
    if (!products) return []
    return products.filter(p => selectedProducts.has(p.nm_id))
  }, [products, selectedProducts])

  /** Check if all visible products are selected */
  const allVisibleSelected = useMemo(() => {
    if (!products || products.length === 0) return false
    return products.every(p => selectedProducts.has(p.nm_id))
  }, [products, selectedProducts])

  /** Handle individual product selection toggle */
  const handleProductSelect = useCallback(
    (nmId: string, checked: boolean) => {
      const newSelected = new Set(selectedProducts)
      if (checked) {
        newSelected.add(nmId)
      } else {
        newSelected.delete(nmId)
      }
      setSelectedProducts(newSelected)
    },
    [selectedProducts]
  )

  /** Handle select all / deselect all visible products */
  const handleSelectAll = useCallback(() => {
    if (!products) return

    if (allVisibleSelected) {
      const newSelected = new Set(selectedProducts)
      products.forEach(p => newSelected.delete(p.nm_id))
      setSelectedProducts(newSelected)
    } else {
      const newSelected = new Set(selectedProducts)
      products.forEach(p => newSelected.add(p.nm_id))
      setSelectedProducts(newSelected)
    }
  }, [products, allVisibleSelected, selectedProducts])

  /** Clear all selections */
  const clearSelection = useCallback(() => {
    setSelectedProducts(new Set())
  }, [])

  /** Set selection to specific nm_ids */
  const setSelection = useCallback((nmIds: string[]) => {
    setSelectedProducts(new Set(nmIds))
  }, [])

  return {
    selectedProducts,
    selectedProductDetails,
    allVisibleSelected,
    handleProductSelect,
    handleSelectAll,
    clearSelection,
    setSelection,
  }
}
