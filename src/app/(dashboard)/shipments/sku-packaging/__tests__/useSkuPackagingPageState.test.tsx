import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SkuPackaging } from '@/types/shipment-cost'

import { useSkuPackagingPageState } from '../useSkuPackagingPageState'

const mockUseSkuPackaging = vi.fn()
const mockUseBoxTypes = vi.fn()

vi.mock('@/hooks/use-sku-packaging', () => ({
  useSkuPackaging: (params?: unknown) => mockUseSkuPackaging(params),
}))

vi.mock('@/hooks/use-box-types', () => ({
  useBoxTypes: (includeInactive?: boolean) => mockUseBoxTypes(includeInactive),
}))

const mappedItem: SkuPackaging = {
  nmId: 123456789,
  cabinetId: 'cab-001',
  boxTypeId: 'bt-001',
  unitsPerBox: 10,
  boxType: {
    id: 'bt-001',
    name: 'Коробка A',
    lengthCm: '60.00',
    widthCm: '40.00',
    heightCm: '30.00',
    volumeCm3: '72000.00',
    isActive: true,
  },
  product: {
    nmId: 123456789,
    vendorCode: 'ART-001',
    brand: 'TestBrand',
    subject: 'Футболка',
  },
  createdAt: '2026-03-10T00:00:00Z',
  updatedAt: '2026-03-10T00:00:00Z',
}

describe('useSkuPackagingPageState', () => {
  const refetch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSkuPackaging.mockReturnValue({
      data: [mappedItem],
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch,
    })
    mockUseBoxTypes.mockReturnValue({
      data: [mappedItem.boxType],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
  })

  it('preserves the unparameterized packaging and active-only box-type queries', () => {
    renderHook(() => useSkuPackagingPageState())

    expect(mockUseSkuPackaging).toHaveBeenCalledWith(undefined)
    expect(mockUseBoxTypes).toHaveBeenCalledWith(undefined)
  })

  it.each([
    ['123456789', 'SKU identity'],
    ['футболка', 'subject'],
    ['art-001', 'vendor code'],
    ['testbrand', 'brand'],
    ['коробка a', 'package name'],
  ])('filters client-locally by %s (%s) without changing query arguments', query => {
    const { result } = renderHook(() => useSkuPackagingPageState())

    act(() => result.current.setQuery(query))

    expect(result.current.filteredItems).toEqual([mappedItem])
    expect(mockUseSkuPackaging).toHaveBeenLastCalledWith(undefined)
    expect(mockUseBoxTypes).toHaveBeenLastCalledWith(undefined)
  })

  it('exposes filtered-empty data and restores all rows when the query is cleared', () => {
    const { result } = renderHook(() => useSkuPackagingPageState())

    act(() => result.current.setQuery('ничего не найдется'))
    expect(result.current.items).toEqual([mappedItem])
    expect(result.current.filteredItems).toEqual([])

    act(() => result.current.clearQuery())
    expect(result.current.query).toBe('')
    expect(result.current.filteredItems).toEqual([mappedItem])
  })

  it('reports either dependency loading/fetching state without hiding box-type failure truth', () => {
    mockUseBoxTypes.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      isError: true,
    })

    const { result } = renderHook(() => useSkuPackagingPageState())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isFetching).toBe(true)
    expect(result.current.isError).toBe(false)
    expect(result.current.isBoxTypesError).toBe(true)
    expect(result.current.hasBoxTypes).toBe(false)
  })

  it.each([
    ['handleCreate', 'isCreateOpen'],
    ['handleBulk', 'isBulkOpen'],
  ] as const)('remembers the exact trigger for %s', (handler, stateKey) => {
    const { result } = renderHook(() => useSkuPackagingPageState())
    const trigger = document.createElement('button')

    act(() => result.current[handler](trigger))

    expect(result.current[stateKey]).toBe(true)
    expect(result.current.returnFocusRef.current).toBe(trigger)
  })

  it.each([
    ['handleEdit', 'editingItem'],
    ['handleDelete', 'deletingItem'],
  ] as const)('remembers the selected entity and row trigger for %s', (handler, stateKey) => {
    const { result } = renderHook(() => useSkuPackagingPageState())
    const trigger = document.createElement('button')

    act(() => result.current[handler](mappedItem, trigger))

    expect(result.current[stateKey]).toBe(mappedItem)
    expect(result.current.returnFocusRef.current).toBe(trigger)
  })

  it('clears create, edit, delete, and bulk state through their close handlers', () => {
    const { result } = renderHook(() => useSkuPackagingPageState())
    const trigger = document.createElement('button')

    act(() => result.current.handleCreate(trigger))
    act(() => result.current.handleFormClose())
    expect(result.current.isCreateOpen).toBe(false)

    act(() => result.current.handleEdit(mappedItem, trigger))
    act(() => result.current.handleFormClose())
    expect(result.current.editingItem).toBeNull()

    act(() => result.current.handleDelete(mappedItem, trigger))
    act(() => result.current.handleDeleteClose())
    expect(result.current.deletingItem).toBeNull()

    act(() => result.current.handleBulk(trigger))
    act(() => result.current.handleBulkClose())
    expect(result.current.isBulkOpen).toBe(false)
  })
})
