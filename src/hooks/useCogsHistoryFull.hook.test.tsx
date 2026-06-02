/**
 * useCogsHistoryFull hook data-path — Validation F-36 (double-unwrap class, see F-30/F-32).
 * GET /v1/cogs/history returns the FULL wrapper { data, meta, pagination } and the
 * /cogs/history page reads all three siblings. The hook MUST pass skipDataUnwrap:true —
 * otherwise apiClient strips the `{ data }` envelope, leaving data.meta/data.pagination
 * undefined → the page renders its empty state even when COGS versions exist.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCogsHistoryFull } from './useCogsHistoryFull'
import { apiClient } from '@/lib/api-client'
import type { CogsHistoryResponse } from '@/types/cogs'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const fullWrapper: CogsHistoryResponse = {
  data: [
    {
      cogs_id: 'c1',
      nm_id: '906010371',
      unit_cost_rub: 500,
      valid_from: '2026-05-01',
      valid_to: null,
      source: 'manual',
      is_deleted: false,
    },
  ] as unknown as CogsHistoryResponse['data'],
  meta: {
    nm_id: '906010371',
    product_name: 'Эмаль корректор',
    current_cogs: { unit_cost_rub: 500, valid_from: '2026-05-01' },
    total_versions: 2,
  },
  pagination: { total: 2, cursor: null, has_more: false },
}

describe('useCogsHistoryFull — F-36 skipDataUnwrap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requests with skipDataUnwrap:true so the { data, meta, pagination } wrapper survives', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(fullWrapper as unknown as never)

    const { result } = renderHook(() => useCogsHistoryFull('906010371'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // LOAD-BEARING regression gate: on revert (option removed) the call becomes
    // apiClient.get(url) with no 2nd arg → this fails. (The shape assertions below
    // pass regardless since the mock returns the full wrapper either way — they only
    // confirm TanStack Query surfaces the value the page's three reads depend on.)
    expect(apiClient.get).toHaveBeenCalledWith(expect.any(String), { skipDataUnwrap: true })

    expect(result.current.data?.data).toHaveLength(1)
    expect(result.current.data?.meta?.product_name).toBe('Эмаль корректор')
    expect(result.current.data?.pagination?.total).toBe(2)
  })
})
