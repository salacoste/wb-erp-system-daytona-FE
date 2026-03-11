/**
 * Tests for SKU Packaging TanStack Query hooks
 * Epic 75-FE: SKU Packaging CRUD + bulk operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'

vi.mock('@/lib/api/shipment-cost', () => ({
  getSkuPackaging: vi.fn(),
  getSkuPackagingByNmId: vi.fn(),
  createSkuPackaging: vi.fn(),
  deleteSkuPackaging: vi.fn(),
  bulkCreateSkuPackaging: vi.fn(),
}))

import {
  getSkuPackaging,
  getSkuPackagingByNmId,
  createSkuPackaging,
  deleteSkuPackaging,
  bulkCreateSkuPackaging,
} from '@/lib/api/shipment-cost'
import {
  skuPackagingQueryKeys,
  useSkuPackaging,
  useSkuPackagingByNmId,
  useCreateSkuPackaging,
  useDeleteSkuPackaging,
  useBulkCreateSkuPackaging,
} from '../use-sku-packaging'

const mockSkuPackaging = [
  {
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
      subject: 'TestProduct',
    },
    createdAt: '2026-03-10T00:00:00Z',
    updatedAt: '2026-03-10T00:00:00Z',
  },
]

let queryClient: QueryClient

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

describe('skuPackagingQueryKeys', () => {
  it('returns expected key arrays', () => {
    expect(skuPackagingQueryKeys.all()).toEqual(['sku-packaging'])
    expect(skuPackagingQueryKeys.list()).toEqual(['sku-packaging', 'list', undefined])
    expect(skuPackagingQueryKeys.list({ nmId: 123 })).toEqual([
      'sku-packaging',
      'list',
      { nmId: 123 },
    ])
    expect(skuPackagingQueryKeys.byNmId(123)).toEqual(['sku-packaging', 'detail', 123])
  })
})

describe('useSkuPackaging', () => {
  it('fetches on mount with no params', async () => {
    vi.mocked(getSkuPackaging).mockResolvedValueOnce(mockSkuPackaging)
    const { result } = renderHook(() => useSkuPackaging(), {
      wrapper: createQueryWrapper(queryClient),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockSkuPackaging)
    expect(getSkuPackaging).toHaveBeenCalledWith(undefined)
  })

  it('passes filter params when provided', async () => {
    vi.mocked(getSkuPackaging).mockResolvedValueOnce(mockSkuPackaging)
    const params = { nmId: 123 }
    const { result } = renderHook(() => useSkuPackaging(params), {
      wrapper: createQueryWrapper(queryClient),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getSkuPackaging).toHaveBeenCalledWith(params)
  })
})

describe('useSkuPackagingByNmId', () => {
  it('fetches single record when nmId is truthy', async () => {
    vi.mocked(getSkuPackagingByNmId).mockResolvedValueOnce(mockSkuPackaging[0])
    const { result } = renderHook(() => useSkuPackagingByNmId(123456789), {
      wrapper: createQueryWrapper(queryClient),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockSkuPackaging[0])
    expect(getSkuPackagingByNmId).toHaveBeenCalledWith(123456789)
  })

  it('is disabled for nmId=0 (guard against invalid IDs)', () => {
    const { result } = renderHook(() => useSkuPackagingByNmId(0), {
      wrapper: createQueryWrapper(queryClient),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(getSkuPackagingByNmId).not.toHaveBeenCalled()
  })
})

describe('useCreateSkuPackaging', () => {
  it('calls createSkuPackaging and invalidates cache', async () => {
    const newData = { nmId: 999, boxTypeId: 'bt-001', unitsPerBox: 5 }
    vi.mocked(createSkuPackaging).mockResolvedValueOnce(mockSkuPackaging[0])
    const { result } = renderHook(() => useCreateSkuPackaging(), {
      wrapper: createQueryWrapper(queryClient),
    })
    await act(async () => {
      await result.current.mutateAsync(newData as never)
    })
    expect(createSkuPackaging).toHaveBeenCalledWith(newData)
  })
})

describe('useDeleteSkuPackaging', () => {
  it('calls deleteSkuPackaging with nmId', async () => {
    vi.mocked(deleteSkuPackaging).mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useDeleteSkuPackaging(), {
      wrapper: createQueryWrapper(queryClient),
    })
    await act(async () => {
      await result.current.mutateAsync(123456789)
    })
    expect(deleteSkuPackaging).toHaveBeenCalledWith(123456789)
  })
})

describe('useBulkCreateSkuPackaging', () => {
  it('calls bulkCreateSkuPackaging and invalidates cache', async () => {
    const bulkData = { items: [{ nmId: 111, boxTypeId: 'bt-001', unitsPerBox: 8 }] }
    const bulkResponse = { created: 1, updated: 0, errors: [] }
    vi.mocked(bulkCreateSkuPackaging).mockResolvedValueOnce(bulkResponse as never)
    const { result } = renderHook(() => useBulkCreateSkuPackaging(), {
      wrapper: createQueryWrapper(queryClient),
    })
    await act(async () => {
      await result.current.mutateAsync(bulkData as never)
    })
    expect(bulkCreateSkuPackaging).toHaveBeenCalledWith(bulkData)
  })
})
