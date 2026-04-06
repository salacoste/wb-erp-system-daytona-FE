/**
 * Tests for useTokenHealth hook
 * GET /v1/cabinets/:id/token-status
 * Story 84.3: Token Health Banner
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { TokenHealthResponse } from '@/types/cabinet'
import type { QueryClient } from '@tanstack/react-query'

vi.mock('@/lib/api/cabinet', () => ({
  getTokenHealth: vi.fn(),
}))

import { getTokenHealth } from '@/lib/api/cabinet'
import { tokenHealthKeys, useTokenHealth } from '../useTokenHealth'

const mockHealthy: TokenHealthResponse = {
  healthy: true,
  lastSuccessAt: '2026-04-06T12:00:00.000Z',
}

const mockUnhealthy: TokenHealthResponse = {
  healthy: false,
  lastError: 'Token expired',
  lastErrorAt: '2026-04-06T11:00:00.000Z',
  firstErrorAt: '2026-04-06T10:00:00.000Z',
  errorCount: 5,
  recommendation: 'Обновите WB API токен в настройках кабинета',
}

const mockedGet = vi.mocked(getTokenHealth)
let queryClient: QueryClient

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

describe('tokenHealthKeys', () => {
  it('returns base key from .all', () => {
    expect(tokenHealthKeys.all).toEqual(['token-health'])
  })

  it('returns key with cabinetId from .byId()', () => {
    expect(tokenHealthKeys.byId('cab-1')).toEqual(['token-health', 'cab-1'])
  })
})

describe('useTokenHealth', () => {
  it('returns healthy token status', async () => {
    mockedGet.mockResolvedValueOnce(mockHealthy)

    const { result } = renderHook(() => useTokenHealth('cab-1'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedGet).toHaveBeenCalledWith('cab-1')
    expect(result.current.data?.healthy).toBe(true)
    expect(result.current.data?.errorCount).toBeUndefined()
  })

  it('returns unhealthy token with error details', async () => {
    mockedGet.mockResolvedValueOnce(mockUnhealthy)

    const { result } = renderHook(() => useTokenHealth('cab-1'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.healthy).toBe(false)
    expect(result.current.data?.errorCount).toBe(5)
    expect(result.current.data?.recommendation).toContain('Обновите')
    expect(result.current.data?.lastError).toBe('Token expired')
  })

  it('is disabled when cabinetId is empty string', () => {
    const { result } = renderHook(() => useTokenHealth(''), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('handles API error gracefully', async () => {
    mockedGet.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useTokenHealth('cab-1'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})
