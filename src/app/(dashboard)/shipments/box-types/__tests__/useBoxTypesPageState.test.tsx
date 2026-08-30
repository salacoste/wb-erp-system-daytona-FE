import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { BoxType } from '@/types/shipment-cost'

import { useBoxTypesPageState } from '../useBoxTypesPageState'

const mockUseBoxTypes = vi.fn()

vi.mock('@/hooks/use-box-types', () => ({
  useBoxTypes: (includeInactive?: boolean) => mockUseBoxTypes(includeInactive),
}))

const boxType: BoxType = {
  id: 'bt-001',
  cabinetId: 'cab-001',
  name: 'Коробка A',
  lengthCm: '60.00',
  widthCm: '40.00',
  heightCm: '30.00',
  volumeCm3: '72000.00',
  isActive: true,
  createdAt: '2026-03-10T00:00:00Z',
  updatedAt: '2026-03-10T00:00:00Z',
}

describe('useBoxTypesPageState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseBoxTypes.mockReturnValue({
      data: [boxType],
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  it('preserves the established active-only list query', () => {
    renderHook(() => useBoxTypesPageState())

    expect(mockUseBoxTypes).toHaveBeenCalledWith(undefined)
  })

  it('remembers the exact create trigger for dialog focus return', () => {
    const { result } = renderHook(() => useBoxTypesPageState())
    const trigger = document.createElement('button')

    act(() => result.current.handleCreate(trigger))

    expect(result.current.isCreateOpen).toBe(true)
    expect(result.current.returnFocusRef.current).toBe(trigger)
  })

  it('remembers the selected entity and exact row trigger for edit', () => {
    const { result } = renderHook(() => useBoxTypesPageState())
    const editTrigger = document.createElement('button')

    act(() => result.current.handleEdit(boxType, editTrigger))
    expect(result.current.editingBoxType).toBe(boxType)
    expect(result.current.returnFocusRef.current).toBe(editTrigger)
  })

  it('remembers the selected entity and exact row trigger for deactivation', () => {
    const { result } = renderHook(() => useBoxTypesPageState())
    const deactivateTrigger = document.createElement('button')

    act(() => result.current.handleDeactivate(boxType, deactivateTrigger))
    expect(result.current.deactivatingBoxType).toBe(boxType)
    expect(result.current.returnFocusRef.current).toBe(deactivateTrigger)
  })

  it('clears create and edit state when the form closes', () => {
    const { result } = renderHook(() => useBoxTypesPageState())
    const trigger = document.createElement('button')

    act(() => result.current.handleCreate(trigger))
    act(() => result.current.handleFormClose())
    expect(result.current.isCreateOpen).toBe(false)

    act(() => result.current.handleEdit(boxType, trigger))
    act(() => result.current.handleFormClose())
    expect(result.current.editingBoxType).toBeNull()
  })

  it('clears the selected entity when deactivation closes', () => {
    const { result } = renderHook(() => useBoxTypesPageState())
    const trigger = document.createElement('button')

    act(() => result.current.handleDeactivate(boxType, trigger))
    act(() => result.current.handleDeactivateClose())

    expect(result.current.deactivatingBoxType).toBeNull()
  })
})
