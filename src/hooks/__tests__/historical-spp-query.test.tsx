import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMarginAnalyticsBySku } from '../useMarginAnalyticsBySku'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn() },
}))

import { apiClient } from '@/lib/api-client'

const mockGet = vi.mocked(apiClient.get)

const rawSku = {
  nm_id: 123,
  sa_name: 'Исторический товар',
  revenue_net: 1000,
  total_units: 2,
  cogs: 400,
  profit: 600,
  margin_pct: 60,
  missing_cogs_flag: false,
  spp_rub: 0,
  spp_pct: null,
}

describe('historical SPP query contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockImplementation(async url => {
      const enabled = String(url).includes('include_cogs=true')
      return {
        items: enabled ? [rawSku] : [{ ...rawSku, spp_rub: undefined, spp_pct: undefined }],
        meta: {},
      }
    })
  })

  it('separates enabled and disabled requests and cache entries', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result, rerender } = renderHook(
      ({ includeCogs }) => useMarginAnalyticsBySku({ week: '2026-W31', includeCogs, limit: 500 }),
      { initialProps: { includeCogs: true }, wrapper }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data[0]).toMatchObject({ spp_rub: 0, spp_pct: null })
    expect(mockGet).toHaveBeenLastCalledWith(expect.stringContaining('include_cogs=true'))

    rerender({ includeCogs: false })
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGet).toHaveBeenLastCalledWith(expect.stringContaining('include_cogs=false'))

    const includeCogsValues = queryClient
      .getQueryCache()
      .getAll()
      .map(query => (query.queryKey[3] as { includeCogs: boolean }).includeCogs)
    expect(includeCogsValues).toEqual(expect.arrayContaining([true, false]))
  })
})
