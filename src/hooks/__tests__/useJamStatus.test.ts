/**
 * Tests for useJamStatus hook
 * GET /v1/cabinets/:id/jam-status
 * Story 84.2: handle `available` field + reason
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { JamStatusResponse } from '@/types/cabinet'
import type { QueryClient } from '@tanstack/react-query'

vi.mock('@/lib/api/cabinet', () => ({
  getJamStatus: vi.fn(),
}))

import { getJamStatus } from '@/lib/api/cabinet'
import { jamStatusKeys, useJamStatus } from '../useJamStatus'

const mockJamAvailable: JamStatusResponse = {
  tier: 'standard',
  available: true,
  searchTextsLimit: 30,
  checkedAt: '2026-03-05T12:00:00.000Z',
  probeCallsMade: 2,
}

const mockJamUnavailable: JamStatusResponse = {
  tier: 'none',
  available: false,
  searchTextsLimit: 0,
  checkedAt: '2026-03-05T12:00:00.000Z',
  probeCallsMade: 0,
  reason: 'token_error',
}

const mockedGet = vi.mocked(getJamStatus)
let queryClient: QueryClient

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

describe('jamStatusKeys', () => {
  it('returns base key from .all', () => {
    expect(jamStatusKeys.all).toEqual(['jam-status'])
  })

  it('returns key with cabinetId from .byId()', () => {
    expect(jamStatusKeys.byId('cab-1')).toEqual(['jam-status', 'cab-1'])
  })
})

describe('useJamStatus', () => {
  it('returns jam status with available: true', async () => {
    mockedGet.mockResolvedValueOnce(mockJamAvailable)

    const { result } = renderHook(() => useJamStatus('cab-1'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedGet).toHaveBeenCalledWith('cab-1')
    expect(result.current.data?.available).toBe(true)
    expect(result.current.data?.tier).toBe('standard')
    expect(result.current.data?.searchTextsLimit).toBe(30)
    expect(result.current.data?.reason).toBeUndefined()
  })

  it.each([
    'no_products',
    'token_error',
    'insufficient_permissions',
    'timeout',
    'wb_api_error',
  ] as const)('returns unavailable jam with reason: %s', async reason => {
    mockedGet.mockResolvedValueOnce({ ...mockJamUnavailable, reason })

    const { result } = renderHook(() => useJamStatus('cab-1'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.available).toBe(false)
    expect(result.current.data?.reason).toBe(reason)
    expect(result.current.data?.tier).toBe('none')
  })

  it('is disabled when cabinetId is empty string', () => {
    const { result } = renderHook(() => useJamStatus(''), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('handles API error gracefully', async () => {
    mockedGet.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useJamStatus('cab-1'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})
