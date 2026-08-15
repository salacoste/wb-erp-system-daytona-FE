/**
 * Tests for usePricingBasis hooks (SPP-1.7-FE)
 * Query enabled-by-cabinetId + mutation invalidates BOTH key families.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'

vi.mock('@/lib/api/pricing-basis', () => ({
  getPricingBasis: vi.fn(),
  updatePricingBasis: vi.fn(),
}))

import { getPricingBasis, updatePricingBasis } from '@/lib/api/pricing-basis'
import { pricingBasisKeys, usePricingBasis, useUpdatePricingBasis } from '../usePricingBasis'

const mockedGet = vi.mocked(getPricingBasis)
const mockedUpdate = vi.mocked(updatePricingBasis)

let queryClient: QueryClient

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

// -- Query keys ---------------------------------------------------------------

describe('pricingBasisKeys', () => {
  it('returns base key from .all', () => {
    expect(pricingBasisKeys.all).toEqual(['pricing-basis'])
  })

  it('returns cabinet-scoped key from .cabinet()', () => {
    expect(pricingBasisKeys.cabinet('cab-1')).toEqual(['pricing-basis', 'cab-1'])
  })

  it('scopes different cabinets to different keys (cabinet isolation)', () => {
    expect(pricingBasisKeys.cabinet('cab-1')).not.toEqual(pricingBasisKeys.cabinet('cab-2'))
  })
})

// -- usePricingBasis (query) --------------------------------------------------

describe('usePricingBasis', () => {
  it('fetches the basis when cabinetId is provided', async () => {
    mockedGet.mockResolvedValueOnce('STOREFRONT_ANON')

    const { result } = renderHook(() => usePricingBasis('cab-1'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedGet).toHaveBeenCalledTimes(1)
    expect(result.current.data).toBe('STOREFRONT_ANON')
  })

  it('is disabled when cabinetId is null', () => {
    const { result } = renderHook(() => usePricingBasis(null), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('surfaces API errors', async () => {
    mockedGet.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => usePricingBasis('cab-1'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})

// -- useUpdatePricingBasis (mutation) ------------------------------------------

describe('useUpdatePricingBasis', () => {
  it('calls updatePricingBasis with the selected basis', async () => {
    mockedUpdate.mockResolvedValueOnce('STOREFRONT_ANON')

    const { result } = renderHook(() => useUpdatePricingBasis('cab-1'), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate('STOREFRONT_ANON')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedUpdate).toHaveBeenCalledWith('STOREFRONT_ANON')
    expect(result.current.data).toBe('STOREFRONT_ANON')
  })

  it('invalidates BOTH pricing-basis and price-recommendations key families on success', async () => {
    mockedUpdate.mockResolvedValueOnce('SELLER')
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdatePricingBasis('cab-1'), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate('SELLER')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['pricing-basis'] })
    )
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['price-recommendations'] })
    )
  })

  it('seeds the cabinet cache with the persisted basis on success', async () => {
    mockedUpdate.mockResolvedValueOnce('STOREFRONT_ANON')
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData')

    const { result } = renderHook(() => useUpdatePricingBasis('cab-1'), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate('STOREFRONT_ANON')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(setQueryDataSpy).toHaveBeenCalledWith(
      pricingBasisKeys.cabinet('cab-1'),
      'STOREFRONT_ANON'
    )
  })

  it('does not seed cache when cabinetId is null', async () => {
    mockedUpdate.mockResolvedValueOnce('SELLER')
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData')

    const { result } = renderHook(() => useUpdatePricingBasis(null), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate('SELLER')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(setQueryDataSpy).not.toHaveBeenCalledWith(
      pricingBasisKeys.cabinet(''),
      expect.anything()
    )
  })

  it('surfaces mutation errors (toggle reverts via onError callback)', async () => {
    mockedUpdate.mockRejectedValueOnce(new Error('Bad Request'))

    const { result } = renderHook(() => useUpdatePricingBasis('cab-1'), {
      wrapper: createQueryWrapper(queryClient),
    })

    result.current.mutate('STOREFRONT_ANON')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})
