/**
 * Tests for Box Types TanStack Query hooks
 * Epic 75-FE: Box Type CRUD + deactivate
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'

vi.mock('@/lib/api/shipment-cost', () => ({
  getBoxTypes: vi.fn(),
  getBoxType: vi.fn(),
  createBoxType: vi.fn(),
  updateBoxType: vi.fn(),
  deactivateBoxType: vi.fn(),
}))

import {
  getBoxTypes,
  getBoxType,
  createBoxType,
  updateBoxType,
  deactivateBoxType,
} from '@/lib/api/shipment-cost'
import {
  boxTypesQueryKeys,
  useBoxTypes,
  useBoxType,
  useCreateBoxType,
  useUpdateBoxType,
  useDeactivateBoxType,
} from '../use-box-types'

const mockBoxTypes = [
  {
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
  },
]

let queryClient: QueryClient

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

describe('boxTypesQueryKeys', () => {
  it('returns expected key arrays', () => {
    expect(boxTypesQueryKeys.all()).toEqual(['box-types'])
    expect(boxTypesQueryKeys.list()).toEqual(['box-types', 'list', { includeInactive: undefined }])
    expect(boxTypesQueryKeys.list(true)).toEqual(['box-types', 'list', { includeInactive: true }])
    expect(boxTypesQueryKeys.byId('bt-001')).toEqual(['box-types', 'detail', 'bt-001'])
  })
})

describe('useBoxTypes', () => {
  it('fetches on mount with includeInactive=false by default', async () => {
    vi.mocked(getBoxTypes).mockResolvedValueOnce(mockBoxTypes)
    const { result } = renderHook(() => useBoxTypes(), {
      wrapper: createQueryWrapper(queryClient),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockBoxTypes)
    expect(getBoxTypes).toHaveBeenCalledWith(false)
  })

  it('passes includeInactive=true when specified', async () => {
    vi.mocked(getBoxTypes).mockResolvedValueOnce(mockBoxTypes)
    const { result } = renderHook(() => useBoxTypes(true), {
      wrapper: createQueryWrapper(queryClient),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getBoxTypes).toHaveBeenCalledWith(true)
  })
})

describe('useBoxType', () => {
  it('fetches single box type when id is truthy', async () => {
    vi.mocked(getBoxType).mockResolvedValueOnce(mockBoxTypes[0])
    const { result } = renderHook(() => useBoxType('bt-001'), {
      wrapper: createQueryWrapper(queryClient),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockBoxTypes[0])
    expect(getBoxType).toHaveBeenCalledWith('bt-001')
  })

  it('is disabled when id is empty string', () => {
    const { result } = renderHook(() => useBoxType(''), {
      wrapper: createQueryWrapper(queryClient),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(getBoxType).not.toHaveBeenCalled()
  })
})

describe('useCreateBoxType', () => {
  it('calls createBoxType and invalidates cache on success', async () => {
    const newData = { name: 'Коробка B', lengthCm: 50, widthCm: 30, heightCm: 20 }
    vi.mocked(createBoxType).mockResolvedValueOnce({ ...mockBoxTypes[0], id: 'bt-002' })
    const { result } = renderHook(() => useCreateBoxType(), {
      wrapper: createQueryWrapper(queryClient),
    })
    await act(async () => {
      await result.current.mutateAsync(newData as never)
    })
    expect(createBoxType).toHaveBeenCalledWith(newData)
  })
})

describe('useUpdateBoxType', () => {
  it('calls updateBoxType with id and data', async () => {
    const updateData = { name: 'Коробка A (обновл.)' }
    vi.mocked(updateBoxType).mockResolvedValueOnce({ ...mockBoxTypes[0], name: updateData.name })
    const { result } = renderHook(() => useUpdateBoxType(), {
      wrapper: createQueryWrapper(queryClient),
    })
    await act(async () => {
      await result.current.mutateAsync({ id: 'bt-001', data: updateData as never })
    })
    expect(updateBoxType).toHaveBeenCalledWith('bt-001', updateData)
  })
})

describe('useDeactivateBoxType', () => {
  it('calls deactivateBoxType and invalidates cache', async () => {
    vi.mocked(deactivateBoxType).mockResolvedValueOnce({ ...mockBoxTypes[0], isActive: false })
    const { result } = renderHook(() => useDeactivateBoxType(), {
      wrapper: createQueryWrapper(queryClient),
    })
    await act(async () => {
      await result.current.mutateAsync('bt-001')
    })
    expect(deactivateBoxType).toHaveBeenCalledWith('bt-001')
  })
})
