/**
 * Unit tests for useOrdersFbo, useOrderFboDetail, useOrdersFboAggregate hooks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useOrdersFbo, useOrderFboDetail, useOrdersFboAggregate } from '../useOrdersFbo'

vi.mock('@/lib/api/orders-fbo', () => ({
  getFboOrders: vi.fn(),
  getFboOrderDetail: vi.fn(),
  getFboOrdersAggregate: vi.fn(),
  ordersFboQueryKeys: {
    all: ['orders-fbo'] as const,
    list: vi.fn((p: Record<string, unknown>) => ['orders-fbo', 'list', p]),
    detail: vi.fn((id: string) => ['orders-fbo', 'detail', id]),
    aggregate: vi.fn((p: Record<string, unknown>) => ['orders-fbo', 'aggregate', p]),
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn() },
}))

import { getFboOrders, getFboOrderDetail, getFboOrdersAggregate } from '@/lib/api/orders-fbo'
const mockGetOrders = vi.mocked(getFboOrders)
const mockGetDetail = vi.mocked(getFboOrderDetail)
const mockGetAggregate = vi.mocked(getFboOrdersAggregate)

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

const mockOrderItem = {
  id: 'order-uuid-001',
  orderId: '123456789',
  srid: 'SR-001',
  nmId: 98765432,
  supplierArticle: 'ART-001',
  barcode: '4600000000001',
  brand: 'TestBrand',
  subject: 'Футболка',
  category: 'Одежда',
  totalPrice: 1500,
  discountPercent: 10,
  spp: null,
  finishedPrice: 1350,
  priceWithDisc: 1350,
  warehouseName: 'Коледино',
  regionName: 'Москва',
  orderDate: '2026-01-15',
  isCancel: false,
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-01-15T10:00:00Z',
}

// FboOrdersListResponse uses 'items' not 'orders'
const mockListResponse = {
  items: [mockOrderItem],
  pagination: { total: 1, limit: 20, offset: 0 },
}

const mockDetailResponse = {
  ...mockOrderItem,
  deliveryDate: '2026-01-20',
  countryName: 'Россия',
}

// FboOrdersAggregateResponse uses count/totalPrice/totalFinishedPrice etc.
const mockAggregateResponse = {
  count: 100,
  totalPrice: 150000,
  totalFinishedPrice: 135000,
  avgPrice: 1500,
  avgFinishedPrice: 1350,
  cancelledCount: 5,
  cancelRate: 5.0,
  dateRange: { from: '2026-01-01', to: '2026-01-31' },
}

describe('useOrdersFbo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches FBO orders list successfully', async () => {
    mockGetOrders.mockResolvedValueOnce(
      mockListResponse as unknown as Awaited<ReturnType<typeof getFboOrders>>
    )

    const { result } = renderHook(() => useOrdersFbo(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toHaveLength(1)
    expect(result.current.data?.items[0].orderId).toBe('123456789')
  })

  it('passes params to API call', async () => {
    mockGetOrders.mockResolvedValueOnce(
      mockListResponse as unknown as Awaited<ReturnType<typeof getFboOrders>>
    )

    renderHook(() => useOrdersFbo({ limit: 10, offset: 20 }), { wrapper: createWrapper() })

    await waitFor(() => expect(mockGetOrders).toHaveBeenCalledTimes(1))
    expect(mockGetOrders).toHaveBeenCalledWith({ limit: 10, offset: 20 })
  })

  it('is disabled when enabled option is false', () => {
    const { result } = renderHook(() => useOrdersFbo({}, { enabled: false }), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('handles API error', async () => {
    mockGetOrders.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useOrdersFbo(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Network error')
  })

  it('handles empty orders list', async () => {
    mockGetOrders.mockResolvedValueOnce({
      items: [],
      pagination: { total: 0, limit: 20, offset: 0 },
    } as unknown as Awaited<ReturnType<typeof getFboOrders>>)

    const { result } = renderHook(() => useOrdersFbo(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toHaveLength(0)
    expect(result.current.data?.pagination.total).toBe(0)
  })
})

describe('useOrderFboDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches order detail successfully', async () => {
    mockGetDetail.mockResolvedValueOnce(
      mockDetailResponse as unknown as Awaited<ReturnType<typeof getFboOrderDetail>>
    )

    const { result } = renderHook(() => useOrderFboDetail('order-uuid-001'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.orderId).toBe('123456789')
    expect(result.current.data?.deliveryDate).toBe('2026-01-20')
  })

  it('is disabled when orderId is null', () => {
    const { result } = renderHook(() => useOrderFboDetail(null), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('handles API error', async () => {
    mockGetDetail.mockRejectedValue(new Error('Not found'))

    const { result } = renderHook(() => useOrderFboDetail('invalid-id'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Not found')
  })
})

describe('useOrdersFboAggregate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches aggregate data successfully', async () => {
    mockGetAggregate.mockResolvedValueOnce(
      mockAggregateResponse as unknown as Awaited<ReturnType<typeof getFboOrdersAggregate>>
    )

    const { result } = renderHook(() => useOrdersFboAggregate(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.count).toBe(100)
    expect(result.current.data?.totalPrice).toBe(150000)
  })

  it('handles API error', async () => {
    mockGetAggregate.mockRejectedValue(new Error('Aggregate error'))

    const { result } = renderHook(() => useOrdersFboAggregate(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Aggregate error')
  })
})
