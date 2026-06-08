/**
 * Tests for useBulkCogsSelection hook
 * Story 4.2: Product selection state management for bulk COGS form
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBulkCogsSelection } from '../useBulkCogsSelection'
import type { BulkCogsProduct } from '../bulk-cogs.types'

const mockProducts: BulkCogsProduct[] = [
  { nm_id: '111', sa_name: 'Product A', brand: 'Brand A' },
  { nm_id: '222', sa_name: 'Product B', brand: 'Brand B' },
  { nm_id: '333', sa_name: 'Product C', brand: 'Brand C' },
]

describe('useBulkCogsSelection', () => {
  beforeEach(() => {
    // Each test gets a fresh hook instance via renderHook
  })

  it('starts with empty selection', () => {
    const { result } = renderHook(() => useBulkCogsSelection(mockProducts))

    expect(result.current.selectedProducts.size).toBe(0)
    expect(result.current.selectedProductDetails).toEqual([])
    expect(result.current.allVisibleSelected).toBe(false)
  })

  it('handles undefined products gracefully', () => {
    const { result } = renderHook(() => useBulkCogsSelection(undefined))

    expect(result.current.selectedProducts.size).toBe(0)
    expect(result.current.selectedProductDetails).toEqual([])
    expect(result.current.allVisibleSelected).toBe(false)
  })

  it('selects an individual product', () => {
    const { result } = renderHook(() => useBulkCogsSelection(mockProducts))

    act(() => {
      result.current.handleProductSelect('111', true)
    })

    expect(result.current.selectedProducts.has('111')).toBe(true)
    expect(result.current.selectedProducts.size).toBe(1)
  })

  it('deselects an individual product', () => {
    const { result } = renderHook(() => useBulkCogsSelection(mockProducts))

    act(() => {
      result.current.handleProductSelect('111', true)
    })
    act(() => {
      result.current.handleProductSelect('111', false)
    })

    expect(result.current.selectedProducts.has('111')).toBe(false)
    expect(result.current.selectedProducts.size).toBe(0)
  })

  it('selects all visible products', () => {
    const { result } = renderHook(() => useBulkCogsSelection(mockProducts))

    act(() => {
      result.current.handleSelectAll()
    })

    expect(result.current.selectedProducts.size).toBe(3)
    expect(result.current.allVisibleSelected).toBe(true)
  })

  it('deselects all when all are already selected', () => {
    const { result } = renderHook(() => useBulkCogsSelection(mockProducts))

    act(() => {
      result.current.handleSelectAll()
    })
    act(() => {
      result.current.handleSelectAll()
    })

    expect(result.current.selectedProducts.size).toBe(0)
    expect(result.current.allVisibleSelected).toBe(false)
  })

  it('reports allVisibleSelected correctly', () => {
    const { result } = renderHook(() => useBulkCogsSelection(mockProducts))

    // Select 2 of 3
    act(() => {
      result.current.handleProductSelect('111', true)
    })
    act(() => {
      result.current.handleProductSelect('222', true)
    })

    expect(result.current.allVisibleSelected).toBe(false)

    // Select the last one
    act(() => {
      result.current.handleProductSelect('333', true)
    })

    expect(result.current.allVisibleSelected).toBe(true)
  })

  it('provides selectedProductDetails for selected items', () => {
    const { result } = renderHook(() => useBulkCogsSelection(mockProducts))

    act(() => {
      result.current.handleProductSelect('111', true)
    })
    act(() => {
      result.current.handleProductSelect('333', true)
    })

    const details = result.current.selectedProductDetails
    expect(details).toHaveLength(2)
    expect(details[0].nm_id).toBe('111')
    expect(details[1].nm_id).toBe('333')
  })

  it('clears all selections', () => {
    const { result } = renderHook(() => useBulkCogsSelection(mockProducts))

    act(() => {
      result.current.handleSelectAll()
    })
    act(() => {
      result.current.clearSelection()
    })

    expect(result.current.selectedProducts.size).toBe(0)
  })

  it('sets selection to specific product IDs', () => {
    const { result } = renderHook(() => useBulkCogsSelection(mockProducts))

    act(() => {
      result.current.handleProductSelect('111', true)
    })

    act(() => {
      result.current.setSelection(['222', '333'])
    })

    expect(result.current.selectedProducts.has('111')).toBe(false)
    expect(result.current.selectedProducts.has('222')).toBe(true)
    expect(result.current.selectedProducts.has('333')).toBe(true)
  })

  it('handleSelectAll does nothing when products are undefined', () => {
    const { result } = renderHook(() => useBulkCogsSelection(undefined))

    act(() => {
      result.current.handleSelectAll()
    })

    expect(result.current.selectedProducts.size).toBe(0)
  })
})
