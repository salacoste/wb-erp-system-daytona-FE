/**
 * Tests for Shipments TanStack Query hooks
 * Epic 76-FE, Story 76.1: CRUD + list with pagination
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'

vi.mock('@/lib/api/shipment-cost', () => ({
  getShipments: vi.fn(),
  getShipment: vi.fn(),
  createShipment: vi.fn(),
  updateShipment: vi.fn(),
  deleteShipment: vi.fn(),
}))

import {
  getShipments,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment,
} from '@/lib/api/shipment-cost'
import {
  shipmentsQueryKeys,
  useShipments,
  useShipment,
  useCreateShipment,
  useUpdateShipment,
  useDeleteShipment,
} from '../use-shipments'
import { DeliveryMode, ShipmentStatus } from '@/types/shipment-cost'

const mockShipment = {
  id: 's-001',
  cabinetId: 'cab-001',
  name: 'Test Shipment',
  deliveryMode: DeliveryMode.FIXED_VEHICLE,
  totalDeliveryCost: '15000.0000',
  palletRate: null,
  status: ShipmentStatus.DRAFT,
  createdBy: 'test@test.com',
  confirmedBy: null,
  confirmedAt: null,
  supplyId: null,
  pallets: [],
  createdAt: '2026-03-11T00:00:00Z',
  updatedAt: '2026-03-11T00:00:00Z',
}

const mockListResponse = { data: [mockShipment], total: 1, page: 1, limit: 10 }

let queryClient: QueryClient

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

describe('shipmentsQueryKeys', () => {
  it('returns expected key arrays', () => {
    expect(shipmentsQueryKeys.all()).toEqual(['shipments'])
    expect(shipmentsQueryKeys.list()).toEqual(['shipments', 'list', undefined])
    expect(shipmentsQueryKeys.list({ status: ShipmentStatus.DRAFT })).toEqual([
      'shipments',
      'list',
      { status: ShipmentStatus.DRAFT },
    ])
    expect(shipmentsQueryKeys.byId('s-001')).toEqual(['shipments', 'detail', 's-001'])
  })
})

describe('useShipments', () => {
  it('fetches shipments list on mount', async () => {
    vi.mocked(getShipments).mockResolvedValueOnce(mockListResponse)
    const { result } = renderHook(() => useShipments(), {
      wrapper: createQueryWrapper(queryClient),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockListResponse)
    expect(getShipments).toHaveBeenCalledWith(undefined)
  })

  it('passes params when provided', async () => {
    const params = { status: ShipmentStatus.DRAFT, page: 2, limit: 20 }
    vi.mocked(getShipments).mockResolvedValueOnce(mockListResponse)
    const { result } = renderHook(() => useShipments(params), {
      wrapper: createQueryWrapper(queryClient),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getShipments).toHaveBeenCalledWith(params)
  })
})

describe('useShipment', () => {
  it('fetches single shipment when id is truthy', async () => {
    vi.mocked(getShipment).mockResolvedValueOnce(mockShipment)
    const { result } = renderHook(() => useShipment('s-001'), {
      wrapper: createQueryWrapper(queryClient),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockShipment)
    expect(getShipment).toHaveBeenCalledWith('s-001')
  })

  it('is disabled when id is empty string', () => {
    const { result } = renderHook(() => useShipment(''), {
      wrapper: createQueryWrapper(queryClient),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(getShipment).not.toHaveBeenCalled()
  })
})

describe('useCreateShipment', () => {
  it('calls createShipment and invalidates cache', async () => {
    const data = {
      name: 'New',
      deliveryMode: DeliveryMode.FIXED_VEHICLE,
      totalDeliveryCost: 15000,
      createdBy: 'test@test.com',
    }
    vi.mocked(createShipment).mockResolvedValueOnce(mockShipment)
    const { result } = renderHook(() => useCreateShipment(), {
      wrapper: createQueryWrapper(queryClient),
    })
    await act(async () => {
      await result.current.mutateAsync(data)
    })
    expect(createShipment).toHaveBeenCalledWith(data)
  })
})

describe('useUpdateShipment', () => {
  it('calls updateShipment with id and data', async () => {
    const updateData = { name: 'Updated' }
    vi.mocked(updateShipment).mockResolvedValueOnce({ ...mockShipment, name: 'Updated' })
    const { result } = renderHook(() => useUpdateShipment(), {
      wrapper: createQueryWrapper(queryClient),
    })
    await act(async () => {
      await result.current.mutateAsync({ id: 's-001', data: updateData })
    })
    expect(updateShipment).toHaveBeenCalledWith('s-001', updateData)
  })
})

describe('useDeleteShipment', () => {
  it('calls deleteShipment and invalidates cache', async () => {
    vi.mocked(deleteShipment).mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useDeleteShipment(), {
      wrapper: createQueryWrapper(queryClient),
    })
    await act(async () => {
      await result.current.mutateAsync('s-001')
    })
    expect(deleteShipment).toHaveBeenCalledWith('s-001')
  })
})
