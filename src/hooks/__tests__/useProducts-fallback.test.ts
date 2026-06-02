/**
 * useProducts — request #190 defensive fallback tests.
 *
 * Backend 500s on `/v1/products?include_cogs=true` when `has_cogs` is absent (the "Все товары"
 * tab). The hook must retry ONCE without `include_cogs` so products still render, flag
 * `marginUnavailable: true`, and keep `include_storage`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from '@/test/utils/test-utils'

// Preserve the REAL ApiError class (instanceof must work — anti-pattern #3) while mocking apiClient.
vi.mock('@/lib/api-client', async importActual => {
  const actual = await importActual<typeof import('@/lib/api-client')>()
  return { ...actual, apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }
})

import { apiClient } from '@/lib/api-client'
import { ApiError } from '@/types/api'
import { useProducts } from '../useProducts'

const mockGet = vi.mocked(apiClient.get)
const productsPayload = {
  products: [{ nm_id: '1', has_cogs: true }],
  pagination: { total: 1, page: 1, limit: 25, total_pages: 1 },
}

describe('useProducts — #190 margin fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('retries WITHOUT include_cogs and flags marginUnavailable when the list 500s', async () => {
    mockGet
      .mockRejectedValueOnce(new ApiError('Internal server error', 500))
      .mockResolvedValueOnce(productsPayload)

    const { result } = renderHook(
      () => useProducts({ include_margin: true, include_storage: true }),
      {
        wrapper: createQueryWrapper(),
      }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.marginUnavailable).toBe(true)
    expect(result.current.data?.products).toHaveLength(1)
    expect(mockGet).toHaveBeenCalledTimes(2)
    // First attempt has include_cogs (from include_margin); the retry must NOT.
    const firstUrl = mockGet.mock.calls[0][0] as string
    const retryUrl = mockGet.mock.calls[1][0] as string
    expect(firstUrl).toContain('include_cogs=true')
    expect(retryUrl).not.toContain('include_cogs')
    // include_storage is unaffected by the bug → preserved on the retry.
    expect(retryUrl).toContain('include_storage=true')
  })

  it('does NOT flag marginUnavailable on the happy path', async () => {
    mockGet.mockResolvedValueOnce(productsPayload)

    const { result } = renderHook(() => useProducts({ include_margin: true }), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.marginUnavailable).toBeUndefined()
    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it('does NOT retry a 500 when margin was not requested (rethrows)', async () => {
    // Two rejections: the primary call + the one TanStack retry (count<1). No fallback fires.
    mockGet
      .mockRejectedValueOnce(new ApiError('Internal server error', 500))
      .mockRejectedValueOnce(new ApiError('Internal server error', 500))

    const { result } = renderHook(() => useProducts({ include_margin: false }), {
      wrapper: createQueryWrapper(),
    })

    // Longer timeout: the hook's own retry (count<1) adds a ~1s delay before settling.
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    // No fallback fired (include_margin false) — the only retries are TanStack's (count<1).
    expect(result.current.data?.marginUnavailable).toBeUndefined()
  })

  it('rethrows the ORIGINAL error (no marginUnavailable) when the fallback ALSO fails', async () => {
    // Every call fails (primary 500 → fallback 500, then TanStack retries the whole queryFn once
    // → primary 500 → fallback 500). Persistent reject is the right tool: ALL calls must fail.
    mockGet.mockRejectedValue(new ApiError('Internal server error', 500))

    const { result } = renderHook(() => useProducts({ include_margin: true }), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    // Fallback also failed → no degraded data, the error surfaces (no silent swallow).
    expect(result.current.data?.marginUnavailable).toBeUndefined()
  })
})
