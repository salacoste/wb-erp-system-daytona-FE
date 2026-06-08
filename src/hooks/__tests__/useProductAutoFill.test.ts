/**
 * Unit tests for useProductAutoFill hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProductAutoFill } from '../useProductAutoFill'
import type { ProductWithDimensions } from '@/types/product'
import type { CategoryCommission } from '@/types/tariffs'
import type { CategoryHierarchy } from '@/types/price-calculator'

// Mock dimension-utils
vi.mock('@/lib/dimension-utils', () => ({
  mmToCm: (mm: number) => mm / 10,
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMocks() {
  const setValue = vi.fn()
  const setSelectedCategory = vi.fn()
  const findCategoryByHierarchy = vi.fn()
  return { setValue, setSelectedCategory, findCategoryByHierarchy }
}

function makeProduct(overrides: Partial<ProductWithDimensions> = {}): ProductWithDimensions {
  return {
    nm_id: 12345,
    name: 'Test Product',
    dimensions: {
      length_mm: 200,
      width_mm: 150,
      height_mm: 100,
      volume_liters: 3.0,
    },
    category_hierarchy: {
      level1: 'Электроника',
      level2: 'Телефоны',
      level3: null,
    } as unknown as CategoryHierarchy,
    ...overrides,
  } as ProductWithDimensions
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useProductAutoFill', () => {
  let mocks: ReturnType<typeof createMocks>

  beforeEach(() => {
    vi.clearAllMocks()
    mocks = createMocks()
  })

  it('returns default state initially', () => {
    const { result } = renderHook(() => useProductAutoFill(mocks))
    expect(result.current.dimensionAutoFill.source).toBe('manual')
    expect(result.current.dimensionAutoFill.status).toBe('none')
    expect(result.current.categoryAutoFill.source).toBe('manual')
    expect(result.current.categoryAutoFill.isLocked).toBe(false)
    expect(result.current.productHasDimensions).toBe(false)
    expect(result.current.productHasCategory).toBe(false)
  })

  it('auto-fills dimensions on product select', () => {
    const { result } = renderHook(() => useProductAutoFill(mocks))
    act(() => {
      result.current.handleProductSelect(makeProduct())
    })

    expect(result.current.dimensionAutoFill.source).toBe('auto')
    expect(result.current.dimensionAutoFill.status).toBe('auto')
    expect(result.current.productHasDimensions).toBe(true)
    // mmToCm: 200→20, 150→15, 100→10
    expect(mocks.setValue).toHaveBeenCalledWith('length_cm', 20)
    expect(mocks.setValue).toHaveBeenCalledWith('width_cm', 15)
    expect(mocks.setValue).toHaveBeenCalledWith('height_cm', 10)
  })

  it('auto-fills category when findCategoryByHierarchy returns a match', () => {
    const mockCategory = { id: 1, name: 'Телефоны' } as unknown as CategoryCommission
    mocks.findCategoryByHierarchy.mockReturnValue(mockCategory)

    const { result } = renderHook(() => useProductAutoFill(mocks))
    act(() => {
      result.current.handleProductSelect(makeProduct())
    })

    expect(result.current.categoryAutoFill.source).toBe('auto')
    expect(result.current.categoryAutoFill.isLocked).toBe(true)
    expect(result.current.productHasCategory).toBe(true)
    expect(mocks.setSelectedCategory).toHaveBeenCalledWith(mockCategory)
  })

  it('does not set category when findCategoryByHierarchy returns null', () => {
    mocks.findCategoryByHierarchy.mockReturnValue(null)
    const product = makeProduct()

    const { result } = renderHook(() => useProductAutoFill(mocks))
    act(() => {
      result.current.handleProductSelect(product)
    })

    // Category state should be set to auto+locked even without a match
    expect(result.current.categoryAutoFill.source).toBe('auto')
    expect(mocks.setSelectedCategory).not.toHaveBeenCalled()
  })

  it('resets state when null product is selected', () => {
    const { result } = renderHook(() => useProductAutoFill(mocks))
    act(() => {
      result.current.handleProductSelect(makeProduct())
    })
    expect(result.current.productHasDimensions).toBe(true)

    act(() => {
      result.current.handleProductSelect(null)
    })

    expect(result.current.dimensionAutoFill.source).toBe('manual')
    expect(result.current.categoryAutoFill.source).toBe('manual')
    expect(result.current.productHasDimensions).toBe(false)
    expect(result.current.productHasCategory).toBe(false)
  })

  it('handles product without dimensions', () => {
    const product = makeProduct({ dimensions: undefined })
    const { result } = renderHook(() => useProductAutoFill(mocks))
    act(() => {
      result.current.handleProductSelect(product)
    })

    expect(result.current.dimensionAutoFill.source).toBe('manual')
    expect(result.current.productHasDimensions).toBe(false)
  })

  it('handles product without category_hierarchy', () => {
    const product = makeProduct({ category_hierarchy: undefined })
    const { result } = renderHook(() => useProductAutoFill(mocks))
    act(() => {
      result.current.handleProductSelect(product)
    })

    expect(result.current.categoryAutoFill.source).toBe('manual')
    expect(result.current.productHasCategory).toBe(false)
  })

  it('markDimensionsModified changes status to modified', () => {
    const { result } = renderHook(() => useProductAutoFill(mocks))
    act(() => {
      result.current.handleProductSelect(makeProduct())
    })
    expect(result.current.dimensionAutoFill.status).toBe('auto')

    act(() => {
      result.current.markDimensionsModified()
    })

    expect(result.current.dimensionAutoFill.status).toBe('modified')
  })

  it('markDimensionsModified is no-op when source is manual', () => {
    const { result } = renderHook(() => useProductAutoFill(mocks))
    act(() => {
      result.current.markDimensionsModified()
    })

    expect(result.current.dimensionAutoFill.status).toBe('none')
  })

  it('restoreDimensions sets form values back to original', () => {
    const { result } = renderHook(() => useProductAutoFill(mocks))
    act(() => {
      result.current.handleProductSelect(makeProduct())
    })
    mocks.setValue.mockClear()

    act(() => {
      result.current.markDimensionsModified()
    })
    act(() => {
      result.current.restoreDimensions()
    })

    expect(mocks.setValue).toHaveBeenCalledWith('length_cm', 20)
    expect(mocks.setValue).toHaveBeenCalledWith('width_cm', 15)
    expect(mocks.setValue).toHaveBeenCalledWith('height_cm', 10)
    expect(result.current.dimensionAutoFill.status).toBe('auto')
  })

  it('clearAutoFill resets all state', () => {
    const { result } = renderHook(() => useProductAutoFill(mocks))
    act(() => {
      result.current.handleProductSelect(makeProduct())
    })
    expect(result.current.productHasDimensions).toBe(true)

    act(() => {
      result.current.clearAutoFill()
    })

    expect(result.current.dimensionAutoFill.source).toBe('manual')
    expect(result.current.categoryAutoFill.source).toBe('manual')
    expect(result.current.productHasDimensions).toBe(false)
    expect(result.current.productHasCategory).toBe(false)
  })
})
