/**
 * Tests for useShipmentsPageState hook
 * Epic 76-FE, Story 76.6 (AC: #6)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'
import { ShipmentStatus } from '@/types/shipment-cost'

const mockShipmentsData = {
  data: [
    { id: 's-1', name: 'First', status: ShipmentStatus.DRAFT, createdAt: '2026-01-02T00:00:00Z' },
    {
      id: 's-2',
      name: 'Second',
      status: ShipmentStatus.CONFIRMED,
      createdAt: '2026-01-01T00:00:00Z',
    },
  ],
  total: 2,
  page: 1,
  limit: 10,
}

const mockUseShipments = vi.fn().mockReturnValue({
  data: mockShipmentsData,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
})

vi.mock('@/hooks/use-shipments', () => ({
  useShipments: (...args: unknown[]) => mockUseShipments(...args),
}))

import { useShipmentsPageState } from '../useShipmentsPageState'

let queryClient: QueryClient

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

describe('useShipmentsPageState', () => {
  function renderPageState() {
    return renderHook(() => useShipmentsPageState(), {
      wrapper: createQueryWrapper(queryClient),
    })
  }

  it('returns correct initial state values', () => {
    const { result } = renderPageState()
    expect(result.current.statusFilter).toBeUndefined()
    expect(result.current.page).toBe(1)
    expect(result.current.limit).toBe(10)
    expect(result.current.sortOrder).toBe('desc')
    expect(result.current.isCreateOpen).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('returns shipments data and total from query', () => {
    const { result } = renderPageState()
    expect(result.current.shipments).toHaveLength(2)
    expect(result.current.total).toBe(2)
  })

  it('changes status filter and resets page to 1', () => {
    const { result } = renderPageState()
    act(() => result.current.handlePageChange(3))
    expect(result.current.page).toBe(3)

    act(() => result.current.handleStatusChange(ShipmentStatus.DRAFT))
    expect(result.current.statusFilter).toBe(ShipmentStatus.DRAFT)
    expect(result.current.page).toBe(1)
  })

  it('cycles status filter: undefined → DRAFT → CONFIRMED → undefined', () => {
    const { result } = renderPageState()
    expect(result.current.statusFilter).toBeUndefined()

    act(() => result.current.handleStatusChange(ShipmentStatus.DRAFT))
    expect(result.current.statusFilter).toBe('DRAFT')

    act(() => result.current.handleStatusChange(ShipmentStatus.CONFIRMED))
    expect(result.current.statusFilter).toBe('CONFIRMED')

    act(() => result.current.handleStatusChange(undefined))
    expect(result.current.statusFilter).toBeUndefined()
  })

  it('updates page via handlePageChange', () => {
    const { result } = renderPageState()
    act(() => result.current.handlePageChange(2))
    expect(result.current.page).toBe(2)
    act(() => result.current.handlePageChange(5))
    expect(result.current.page).toBe(5)
  })

  it('updates limit and resets page to 1', () => {
    const { result } = renderPageState()
    act(() => result.current.handlePageChange(3))
    expect(result.current.page).toBe(3)

    act(() => result.current.handleLimitChange(20))
    expect(result.current.limit).toBe(20)
    expect(result.current.page).toBe(1)
  })

  it('toggles sort order between desc and asc', () => {
    const { result } = renderPageState()
    expect(result.current.sortOrder).toBe('desc')

    act(() => result.current.handleSortToggle())
    expect(result.current.sortOrder).toBe('asc')

    act(() => result.current.handleSortToggle())
    expect(result.current.sortOrder).toBe('desc')
  })

  it('reverses shipments array when sortOrder is asc', () => {
    const { result } = renderPageState()
    // Default desc — same order as API
    expect(result.current.shipments[0].id).toBe('s-1')

    act(() => result.current.handleSortToggle())
    // asc — reversed
    expect(result.current.shipments[0].id).toBe('s-2')
    expect(result.current.shipments[1].id).toBe('s-1')
  })

  it('manages create dialog open/close state', () => {
    const { result } = renderPageState()
    expect(result.current.isCreateOpen).toBe(false)

    act(() => result.current.setIsCreateOpen(true))
    expect(result.current.isCreateOpen).toBe(true)

    act(() => result.current.setIsCreateOpen(false))
    expect(result.current.isCreateOpen).toBe(false)
  })

  it('passes correct params to useShipments after filter and page changes', () => {
    const { result } = renderPageState()
    expect(mockUseShipments).toHaveBeenCalledWith({ status: undefined, page: 1, limit: 10 })

    act(() => result.current.handleStatusChange(ShipmentStatus.DRAFT))
    expect(mockUseShipments).toHaveBeenCalledWith({ status: 'DRAFT', page: 1, limit: 10 })

    act(() => result.current.handlePageChange(2))
    expect(mockUseShipments).toHaveBeenCalledWith({ status: 'DRAFT', page: 2, limit: 10 })

    act(() => result.current.handleLimitChange(50))
    expect(mockUseShipments).toHaveBeenCalledWith({ status: 'DRAFT', page: 1, limit: 50 })
  })
})
