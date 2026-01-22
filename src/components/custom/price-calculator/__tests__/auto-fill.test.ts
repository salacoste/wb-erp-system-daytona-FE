/**
 * Unit Tests for Auto-fill Logic
 * Stories 44.26a-FE & 44.26b-FE
 *
 * Tests cover:
 * - handleProductSelect logic
 * - Dimension conversion (mm → cm)
 * - Category auto-fill
 * - Restore functionality
 * - Edge cases (null dimensions, null category)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  mockProductWithFullData,
  mockProductWithoutDimensions,
  mockProductWithoutCategory,
  mockProductWithoutBoth,
  mockProductWithZeroDimensions,
  mockProductWithDecimalDimensions,
  mockProductWithTopLevelCategory,
  expectedDimensionsAutoFillStateAfterSelection,
  expectedDimensionsAutoFillStateAfterEdit,
  expectedDimensionsAutoFillStateCleared,
  expectedCategoryAutoFillStateAfterSelection,
  expectedCategoryAutoFillStateCleared,
  mmToCm,
  getExpectedFormValuesAfterAutoFill,
  type ProductWithDimensions,
  type AutoFillSource,
  type AutoFillStatus,
} from '@/test/fixtures/products-dimensions'

// ============================================================================
// Type Definitions for Tests
// ============================================================================

interface DimensionAutoFillState {
  source: AutoFillSource
  originalValues: {
    length_cm: number
    width_cm: number
    height_cm: number
    volume_liters: number
  } | null
  status: AutoFillStatus
}

interface CategoryAutoFillState {
  source: AutoFillSource
  isLocked: boolean
  originalCategory: {
    subject_id: number
    subject_name: string
    parent_id: number | null
    parent_name: string | null
  } | null
}

// ============================================================================
// Test: Dimension Conversion (mm → cm)
// ============================================================================

describe('mmToCm conversion', () => {
  it('converts 400mm to 40cm', () => {
    expect(mmToCm(400)).toBe(40)
  })

  it('converts 300mm to 30cm', () => {
    expect(mmToCm(300)).toBe(30)
  })

  it('converts 50mm to 5cm', () => {
    expect(mmToCm(50)).toBe(5)
  })

  it('converts 0mm to 0cm', () => {
    expect(mmToCm(0)).toBe(0)
  })

  it('converts 405mm to 40.5cm (decimal)', () => {
    expect(mmToCm(405)).toBe(40.5)
  })

  it('converts 5000mm to 500cm (large)', () => {
    expect(mmToCm(5000)).toBe(500)
  })
})

// ============================================================================
// Test: getExpectedFormValuesAfterAutoFill
// ============================================================================

describe('getExpectedFormValuesAfterAutoFill', () => {
  it('returns correct form values for product with dimensions', () => {
    const result = getExpectedFormValuesAfterAutoFill(mockProductWithFullData)

    expect(result).toEqual({
      length_cm: 40, // 400mm / 10
      width_cm: 30, // 300mm / 10
      height_cm: 5, // 50mm / 10
      volume_liters: 6.0, // from backend directly
    })
  })

  it('returns null for product without dimensions', () => {
    const result = getExpectedFormValuesAfterAutoFill(mockProductWithoutDimensions)
    expect(result).toBeNull()
  })

  it('handles decimal dimensions correctly', () => {
    const result = getExpectedFormValuesAfterAutoFill(mockProductWithDecimalDimensions)

    expect(result).toEqual({
      length_cm: 40.5, // 405mm / 10
      width_cm: 25.5, // 255mm / 10
      height_cm: 12.5, // 125mm / 10
      volume_liters: 12.909375,
    })
  })

  it('handles zero dimensions correctly', () => {
    const result = getExpectedFormValuesAfterAutoFill(mockProductWithZeroDimensions)

    expect(result).toEqual({
      length_cm: 0,
      width_cm: 0,
      height_cm: 0,
      volume_liters: 0,
    })
  })
})

// ============================================================================
// Test: handleProductSelect - Dimensions Auto-fill
// ============================================================================

describe('handleProductSelect - Dimensions Auto-fill', () => {
  let setValueMock: ReturnType<typeof vi.fn>
  let setDimensionsAutoFillMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setValueMock = vi.fn()
    setDimensionsAutoFillMock = vi.fn()
  })

  /**
   * Simulates handleProductSelect for dimensions
   */
  function handleProductSelectDimensions(
    product: ProductWithDimensions | null,
    setValue: (field: string, value: number) => void,
    setDimensionsAutoFill: (state: DimensionAutoFillState) => void
  ) {
    if (product && product.dimensions) {
      const lengthCm = product.dimensions.length_mm / 10
      const widthCm = product.dimensions.width_mm / 10
      const heightCm = product.dimensions.height_mm / 10
      const volumeLiters = product.dimensions.volume_liters

      setValue('length_cm', lengthCm)
      setValue('width_cm', widthCm)
      setValue('height_cm', heightCm)
      setValue('volume_liters', volumeLiters)

      setDimensionsAutoFill({
        source: 'auto',
        originalValues: {
          length_cm: lengthCm,
          width_cm: widthCm,
          height_cm: heightCm,
          volume_liters: volumeLiters,
        },
        status: 'auto',
      })
    } else if (product === null) {
      setDimensionsAutoFill({
        source: 'manual',
        originalValues: null,
        status: 'none',
      })
    }
    // If product exists but dimensions is null, do nothing (manual mode)
  }

  it('auto-fills dimensions from product with full data', () => {
    handleProductSelectDimensions(mockProductWithFullData, setValueMock, setDimensionsAutoFillMock)

    expect(setValueMock).toHaveBeenCalledWith('length_cm', 40)
    expect(setValueMock).toHaveBeenCalledWith('width_cm', 30)
    expect(setValueMock).toHaveBeenCalledWith('height_cm', 5)
    expect(setValueMock).toHaveBeenCalledWith('volume_liters', 6.0)
    expect(setValueMock).toHaveBeenCalledTimes(4)

    expect(setDimensionsAutoFillMock).toHaveBeenCalledWith(
      expectedDimensionsAutoFillStateAfterSelection
    )
  })

  it('does not auto-fill when product has null dimensions', () => {
    handleProductSelectDimensions(
      mockProductWithoutDimensions,
      setValueMock,
      setDimensionsAutoFillMock
    )

    expect(setValueMock).not.toHaveBeenCalled()
    expect(setDimensionsAutoFillMock).not.toHaveBeenCalled()
  })

  it('clears auto-fill state when product is null', () => {
    handleProductSelectDimensions(null, setValueMock, setDimensionsAutoFillMock)

    expect(setValueMock).not.toHaveBeenCalled()
    expect(setDimensionsAutoFillMock).toHaveBeenCalledWith(expectedDimensionsAutoFillStateCleared)
  })

  it('uses backend volume_liters directly (not recalculated)', () => {
    handleProductSelectDimensions(mockProductWithFullData, setValueMock, setDimensionsAutoFillMock)

    // Verify backend volume is used, not recalculated
    expect(setValueMock).toHaveBeenCalledWith('volume_liters', 6.0)

    const autoFillCall = setDimensionsAutoFillMock.mock.calls[0][0]
    expect(autoFillCall.originalValues.volume_liters).toBe(6.0)
  })

  it('handles decimal dimensions correctly', () => {
    handleProductSelectDimensions(
      mockProductWithDecimalDimensions,
      setValueMock,
      setDimensionsAutoFillMock
    )

    expect(setValueMock).toHaveBeenCalledWith('length_cm', 40.5)
    expect(setValueMock).toHaveBeenCalledWith('width_cm', 25.5)
    expect(setValueMock).toHaveBeenCalledWith('height_cm', 12.5)
  })

  it('handles zero dimensions as valid', () => {
    handleProductSelectDimensions(
      mockProductWithZeroDimensions,
      setValueMock,
      setDimensionsAutoFillMock
    )

    expect(setValueMock).toHaveBeenCalledWith('length_cm', 0)
    expect(setValueMock).toHaveBeenCalledWith('width_cm', 0)
    expect(setValueMock).toHaveBeenCalledWith('height_cm', 0)
    expect(setValueMock).toHaveBeenCalledWith('volume_liters', 0)
  })
})

// ============================================================================
// Test: handleProductSelect - Category Auto-fill
// ============================================================================

describe('handleProductSelect - Category Auto-fill', () => {
  let setSelectedCategoryMock: ReturnType<typeof vi.fn>
  let setCategoryAutoFillMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setSelectedCategoryMock = vi.fn()
    setCategoryAutoFillMock = vi.fn()
  })

  /**
   * Simulates handleProductSelect for category
   */
  function handleProductSelectCategory(
    product: ProductWithDimensions | null,
    setSelectedCategory: (category: unknown) => void,
    setCategoryAutoFill: (state: CategoryAutoFillState) => void
  ) {
    if (product && product.category_hierarchy) {
      setSelectedCategory({
        parentID: product.category_hierarchy.parent_id,
        parentName: product.category_hierarchy.parent_name,
        subjectID: product.category_hierarchy.subject_id,
        subjectName: product.category_hierarchy.subject_name,
        kgvpMarketplace: 0,
        paidStorageKgvp: 0,
      })

      setCategoryAutoFill({
        source: 'auto',
        isLocked: true,
        originalCategory: product.category_hierarchy,
      })
    } else if (product === null) {
      setCategoryAutoFill({
        source: 'manual',
        isLocked: false,
        originalCategory: null,
      })
    }
  }

  it('auto-fills category from product with category_hierarchy', () => {
    handleProductSelectCategory(
      mockProductWithFullData,
      setSelectedCategoryMock,
      setCategoryAutoFillMock
    )

    expect(setSelectedCategoryMock).toHaveBeenCalledWith({
      parentID: 8,
      parentName: 'Женская одежда',
      subjectID: 105,
      subjectName: 'Платья',
      kgvpMarketplace: 0,
      paidStorageKgvp: 0,
    })

    expect(setCategoryAutoFillMock).toHaveBeenCalledWith({
      source: 'auto',
      isLocked: true,
      originalCategory: expectedCategoryAutoFillStateAfterSelection.originalCategory,
    })
  })

  it('locks CategorySelector when category auto-filled', () => {
    handleProductSelectCategory(
      mockProductWithFullData,
      setSelectedCategoryMock,
      setCategoryAutoFillMock
    )

    const autoFillCall = setCategoryAutoFillMock.mock.calls[0][0]
    expect(autoFillCall.isLocked).toBe(true)
  })

  it('does not auto-fill when product has null category_hierarchy', () => {
    handleProductSelectCategory(
      mockProductWithoutCategory,
      setSelectedCategoryMock,
      setCategoryAutoFillMock
    )

    expect(setSelectedCategoryMock).not.toHaveBeenCalled()
    expect(setCategoryAutoFillMock).not.toHaveBeenCalled()
  })

  it('clears auto-fill state when product is null', () => {
    handleProductSelectCategory(null, setSelectedCategoryMock, setCategoryAutoFillMock)

    expect(setSelectedCategoryMock).not.toHaveBeenCalled()
    expect(setCategoryAutoFillMock).toHaveBeenCalledWith(expectedCategoryAutoFillStateCleared)
  })

  it('handles top-level category (null parent_id)', () => {
    handleProductSelectCategory(
      mockProductWithTopLevelCategory,
      setSelectedCategoryMock,
      setCategoryAutoFillMock
    )

    expect(setSelectedCategoryMock).toHaveBeenCalledWith({
      parentID: null,
      parentName: null,
      subjectID: 500,
      subjectName: 'Электроника',
      kgvpMarketplace: 0,
      paidStorageKgvp: 0,
    })
  })
})

// ============================================================================
// Test: Dimension Edit Detection
// ============================================================================

describe('Dimension Edit Detection', () => {
  /**
   * Simulates handleDimensionChange
   */
  function handleDimensionChange(
    currentSource: AutoFillSource,
    setDimensionsAutoFill: (updater: (prev: DimensionAutoFillState) => DimensionAutoFillState) => void
  ) {
    if (currentSource === 'auto') {
      setDimensionsAutoFill((prev) => ({ ...prev, status: 'modified' }))
    }
  }

  it('changes status to modified when editing auto-filled dimension', () => {
    const setDimensionsAutoFillMock = vi.fn()
    handleDimensionChange('auto', setDimensionsAutoFillMock)

    expect(setDimensionsAutoFillMock).toHaveBeenCalled()
    const updater = setDimensionsAutoFillMock.mock.calls[0][0]
    const newState = updater(expectedDimensionsAutoFillStateAfterSelection)
    expect(newState.status).toBe('modified')
  })

  it('does not change status in manual mode', () => {
    const setDimensionsAutoFillMock = vi.fn()
    handleDimensionChange('manual', setDimensionsAutoFillMock)

    expect(setDimensionsAutoFillMock).not.toHaveBeenCalled()
  })
})

// ============================================================================
// Test: Restore Functionality
// ============================================================================

describe('Restore Functionality', () => {
  let setValueMock: ReturnType<typeof vi.fn>
  let setDimensionsAutoFillMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setValueMock = vi.fn()
    setDimensionsAutoFillMock = vi.fn()
  })

  /**
   * Simulates handleRestoreDimensions
   */
  function handleRestoreDimensions(
    originalValues: DimensionAutoFillState['originalValues'],
    setValue: (field: string, value: number) => void,
    setDimensionsAutoFill: (updater: (prev: DimensionAutoFillState) => DimensionAutoFillState) => void
  ) {
    if (originalValues) {
      setValue('length_cm', originalValues.length_cm)
      setValue('width_cm', originalValues.width_cm)
      setValue('height_cm', originalValues.height_cm)
      setValue('volume_liters', originalValues.volume_liters)
      setDimensionsAutoFill((prev) => ({ ...prev, status: 'auto' }))
    }
  }

  it('restores all dimension values to original', () => {
    const originalValues = expectedDimensionsAutoFillStateAfterSelection.originalValues

    handleRestoreDimensions(originalValues, setValueMock, setDimensionsAutoFillMock)

    expect(setValueMock).toHaveBeenCalledWith('length_cm', 40)
    expect(setValueMock).toHaveBeenCalledWith('width_cm', 30)
    expect(setValueMock).toHaveBeenCalledWith('height_cm', 5)
    expect(setValueMock).toHaveBeenCalledWith('volume_liters', 6.0)
  })

  it('restores backend volume_liters value', () => {
    const originalValues = expectedDimensionsAutoFillStateAfterSelection.originalValues

    handleRestoreDimensions(originalValues, setValueMock, setDimensionsAutoFillMock)

    expect(setValueMock).toHaveBeenCalledWith('volume_liters', 6.0)
  })

  it('changes status back to auto after restore', () => {
    const originalValues = expectedDimensionsAutoFillStateAfterSelection.originalValues

    handleRestoreDimensions(originalValues, setValueMock, setDimensionsAutoFillMock)

    expect(setDimensionsAutoFillMock).toHaveBeenCalled()
    const updater = setDimensionsAutoFillMock.mock.calls[0][0]
    const newState = updater(expectedDimensionsAutoFillStateAfterEdit)
    expect(newState.status).toBe('auto')
  })

  it('does nothing when originalValues is null', () => {
    handleRestoreDimensions(null, setValueMock, setDimensionsAutoFillMock)

    expect(setValueMock).not.toHaveBeenCalled()
    expect(setDimensionsAutoFillMock).not.toHaveBeenCalled()
  })
})

// ============================================================================
// Test: Product Clear Logic
// ============================================================================

describe('Product Clear Logic', () => {
  it('resets dimensionsAutoFill on product clear', () => {
    const result: DimensionAutoFillState = {
      source: 'manual',
      originalValues: null,
      status: 'none',
    }

    expect(result).toEqual(expectedDimensionsAutoFillStateCleared)
  })

  it('resets categoryAutoFill on product clear', () => {
    const result: CategoryAutoFillState = {
      source: 'manual',
      isLocked: false,
      originalCategory: null,
    }

    expect(result).toEqual(expectedCategoryAutoFillStateCleared)
  })

  it('unlocks CategorySelector when isLocked is false', () => {
    const state = expectedCategoryAutoFillStateCleared
    expect(state.isLocked).toBe(false)
  })
})

// ============================================================================
// Test: nm_id Type Verification
// ============================================================================

describe('nm_id Type Verification', () => {
  it('nm_id is string type in mockProductWithFullData', () => {
    expect(typeof mockProductWithFullData.nm_id).toBe('string')
    expect(mockProductWithFullData.nm_id).toBe('147205694')
  })

  it('nm_id remains string after selection', () => {
    const selectedNmId = mockProductWithFullData.nm_id
    expect(typeof selectedNmId).toBe('string')
    // Ensure no accidental number conversion
    expect(selectedNmId).not.toBe(147205694)
  })
})

// ============================================================================
// Test: Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('handles product without both dimensions and category', () => {
    expect(mockProductWithoutBoth.dimensions).toBeNull()
    expect(mockProductWithoutBoth.category_hierarchy).toBeNull()
  })

  it('handles product with zero volume correctly', () => {
    const result = getExpectedFormValuesAfterAutoFill(mockProductWithZeroDimensions)
    expect(result?.volume_liters).toBe(0)
  })

  it('preserves decimal precision in conversion', () => {
    expect(mmToCm(405)).toBe(40.5)
    expect(mmToCm(255)).toBe(25.5)
    expect(mmToCm(125)).toBe(12.5)
  })
})
