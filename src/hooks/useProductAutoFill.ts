/**
 * useProductAutoFill - Auto-fill Dimensions & Category from Product
 * Story 44.26b-FE: Auto-fill Dimensions & Category
 *
 * Manages auto-fill state when product is selected from catalog.
 * Handles dimension conversion (mm → cm) and category lock/unlock.
 */

import { useState, useCallback } from 'react'
import { mmToCm } from '@/lib/dimension-utils'
import type { FieldValues, UseFormSetValue } from 'react-hook-form'
import type { ProductWithDimensions } from '@/types/product'
import type { CategoryCommission } from '@/types/tariffs'
import type {
  DimensionAutoFillState,
  CategoryAutoFillState,
  CategoryHierarchy,
} from '@/types/price-calculator'

/** Default dimension auto-fill state (manual mode) */
const DEFAULT_DIMENSION_STATE: DimensionAutoFillState = {
  source: 'manual',
  originalValues: null,
  status: 'none',
}

/** Default category auto-fill state (unlocked) */
const DEFAULT_CATEGORY_STATE: CategoryAutoFillState = {
  source: 'manual',
  isLocked: false,
  originalCategory: null,
}

export interface UseProductAutoFillOptions<T extends FieldValues> {
  setValue: UseFormSetValue<T>
  setSelectedCategory: (category: CategoryCommission | null) => void
  /** Optional: lookup commission from category hierarchy */
  findCategoryByHierarchy?: (hierarchy: CategoryHierarchy) => CategoryCommission | null
}

export interface UseProductAutoFillReturn {
  /** Current dimension auto-fill state */
  dimensionAutoFill: DimensionAutoFillState
  /** Current category auto-fill state */
  categoryAutoFill: CategoryAutoFillState
  /** Handle product selection - auto-fills dimensions and category */
  handleProductSelect: (product: ProductWithDimensions | null) => void
  /** Mark dimensions as modified (called when user edits) */
  markDimensionsModified: () => void
  /** Restore dimensions to original auto-filled values */
  restoreDimensions: () => void
  /** Clear all auto-fill state */
  clearAutoFill: () => void
  /** Whether product has dimensions data */
  productHasDimensions: boolean
  /** Whether product has category data */
  productHasCategory: boolean
}

/**
 * Hook for managing product auto-fill state
 * Handles dimension conversion and category locking
 */
export function useProductAutoFill<T extends FieldValues>({
  setValue,
  setSelectedCategory,
  findCategoryByHierarchy,
}: UseProductAutoFillOptions<T>): UseProductAutoFillReturn {
  const [dimensionAutoFill, setDimensionAutoFill] = useState<DimensionAutoFillState>(DEFAULT_DIMENSION_STATE)
  const [categoryAutoFill, setCategoryAutoFill] = useState<CategoryAutoFillState>(DEFAULT_CATEGORY_STATE)
  const [productHasDimensions, setProductHasDimensions] = useState(false)
  const [productHasCategory, setProductHasCategory] = useState(false)

  const handleProductSelect = useCallback(
    (product: ProductWithDimensions | null) => {
      if (!product) {
        // Clear product - reset to manual mode
        setDimensionAutoFill(DEFAULT_DIMENSION_STATE)
        setCategoryAutoFill(DEFAULT_CATEGORY_STATE)
        setProductHasDimensions(false)
        setProductHasCategory(false)
        return
      }

      // Auto-fill dimensions if available
      if (product.dimensions) {
        const lengthCm = mmToCm(product.dimensions.length_mm)
        const widthCm = mmToCm(product.dimensions.width_mm)
        const heightCm = mmToCm(product.dimensions.height_mm)
        const volumeLiters = product.dimensions.volume_liters

        // Set form values using type assertions for react-hook-form compatibility
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue('length_cm' as any, lengthCm as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue('width_cm' as any, widthCm as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue('height_cm' as any, heightCm as any)

        setDimensionAutoFill({
          source: 'auto',
          originalValues: { length_cm: lengthCm, width_cm: widthCm, height_cm: heightCm, volume_liters: volumeLiters },
          status: 'auto',
        })
        setProductHasDimensions(true)
      } else {
        setDimensionAutoFill(DEFAULT_DIMENSION_STATE)
        setProductHasDimensions(false)
      }

      // Auto-fill category if available
      if (product.category_hierarchy) {
        const categoryFromLookup = findCategoryByHierarchy?.(product.category_hierarchy)
        if (categoryFromLookup) {
          setSelectedCategory(categoryFromLookup)
        }
        setCategoryAutoFill({
          source: 'auto',
          isLocked: true,
          originalCategory: product.category_hierarchy,
        })
        setProductHasCategory(true)
      } else {
        setCategoryAutoFill(DEFAULT_CATEGORY_STATE)
        setProductHasCategory(false)
      }
    },
    [setValue, setSelectedCategory, findCategoryByHierarchy],
  )

  const markDimensionsModified = useCallback(() => {
    if (dimensionAutoFill.source === 'auto') {
      setDimensionAutoFill((prev) => ({ ...prev, status: 'modified' }))
    }
  }, [dimensionAutoFill.source])

  const restoreDimensions = useCallback(() => {
    if (dimensionAutoFill.originalValues) {
      const { length_cm, width_cm, height_cm } = dimensionAutoFill.originalValues
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue('length_cm' as any, length_cm as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue('width_cm' as any, width_cm as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue('height_cm' as any, height_cm as any)
      setDimensionAutoFill((prev) => ({ ...prev, status: 'auto' }))
    }
  }, [dimensionAutoFill.originalValues, setValue])

  const clearAutoFill = useCallback(() => {
    setDimensionAutoFill(DEFAULT_DIMENSION_STATE)
    setCategoryAutoFill(DEFAULT_CATEGORY_STATE)
    setProductHasDimensions(false)
    setProductHasCategory(false)
  }, [])

  return {
    dimensionAutoFill,
    categoryAutoFill,
    handleProductSelect,
    markDimensionsModified,
    restoreDimensions,
    clearAutoFill,
    productHasDimensions,
    productHasCategory,
  }
}
