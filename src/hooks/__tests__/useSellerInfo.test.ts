/**
 * Tests for useSellerInfo hook
 * GET /v1/cabinets/:id/seller-info
 * Story 84.1: handle `available` field + `sid` type
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { SellerInfoResponse } from '@/types/cabinet'
import type { QueryClient } from '@tanstack/react-query'

vi.mock('@/lib/api/cabinet', () => ({
  getSellerInfo: vi.fn(),
}))

import { getSellerInfo } from '@/lib/api/cabinet'
import { sellerInfoKeys, useSellerInfo } from '../useSellerInfo'

const mockSellerAvailable: SellerInfoResponse = {
  name: 'My Shop',
  sid: '87935c94-cb5b-4f17-a1fc-809ac83aaa7e',
  tradeMark: 'MyBrand',
  available: true,
}

const mockSellerUnavailable: SellerInfoResponse = {
  name: '',
  sid: '',
  tradeMark: '',
  available: false,
  reason: 'token_error',
}

const mockedGet = vi.mocked(getSellerInfo)
let queryClient: QueryClient

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

describe('sellerInfoKeys', () => {
  it('returns base key from .all', () => {
    expect(sellerInfoKeys.all).toEqual(['seller-info'])
  })

  it('returns key with cabinetId from .byId()', () => {
    expect(sellerInfoKeys.byId('cab-1')).toEqual(['seller-info', 'cab-1'])
  })
})

describe('useSellerInfo', () => {
  it('returns seller info with available: true', async () => {
    mockedGet.mockResolvedValueOnce(mockSellerAvailable)

    const { result } = renderHook(() => useSellerInfo('cab-1'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedGet).toHaveBeenCalledWith('cab-1')
    expect(result.current.data?.available).toBe(true)
    expect(result.current.data?.name).toBe('My Shop')
    expect(result.current.data?.sid).toBe('87935c94-cb5b-4f17-a1fc-809ac83aaa7e')
    expect(result.current.data?.tradeMark).toBe('MyBrand')
    expect(result.current.data?.reason).toBeUndefined()
  })

  it.each(['token_error', 'insufficient_permissions', 'timeout', 'wb_api_error'] as const)(
    'returns unavailable seller with reason: %s',
    async reason => {
      mockedGet.mockResolvedValueOnce({ ...mockSellerUnavailable, reason })

      const { result } = renderHook(() => useSellerInfo('cab-1'), {
        wrapper: createQueryWrapper(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.available).toBe(false)
      expect(result.current.data?.reason).toBe(reason)
      expect(result.current.data?.name).toBe('')
    }
  )

  it('is disabled when cabinetId is empty string', () => {
    const { result } = renderHook(() => useSellerInfo(''), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('handles API error gracefully', async () => {
    mockedGet.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useSellerInfo('cab-1'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})
