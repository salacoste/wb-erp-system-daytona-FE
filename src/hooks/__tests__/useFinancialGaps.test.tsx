/**
 * Tests for useFinancialGaps, useAnalyzeGap, useRemediateGap hooks
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFinancialGaps, useAnalyzeGap, useRemediateGap } from '../useFinancialGaps'
import * as gapsApi from '@/lib/api/financial-gaps'

vi.mock('@/lib/api/financial-gaps', () => ({
  getFinancialGaps: vi.fn(),
  analyzeGap: vi.fn(),
  remediateGap: vi.fn(),
}))

const mockGetGaps = vi.mocked(gapsApi.getFinancialGaps)
const mockAnalyzeGap = vi.mocked(gapsApi.analyzeGap)
const mockRemediateGap = vi.mocked(gapsApi.remediateGap)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const mockGapsResponse = {
  gaps: [
    {
      missing_date: '2026-05-15',
      source: 'wb_finance_raw' as const,
      root_cause: 'IMPORT_FAILED' as const,
      severity: 'critical' as const,
    },
  ],
  total: 1,
}

describe('useFinancialGaps', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches gaps with valid params', async () => {
    mockGetGaps.mockResolvedValueOnce(mockGapsResponse as never)

    const { result } = renderHook(
      () => useFinancialGaps({ dateFrom: '2026-05-01', dateTo: '2026-05-31' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetGaps).toHaveBeenCalledWith({ dateFrom: '2026-05-01', dateTo: '2026-05-31' })
    expect(result.current.data?.total).toBe(1)
  })

  it('is disabled when dateFrom is missing', () => {
    const { result } = renderHook(() => useFinancialGaps({ dateFrom: '', dateTo: '2026-05-31' }), {
      wrapper: createWrapper(),
    })

    expect(mockGetGaps).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(true)
  })

  it('is disabled when dateTo is missing', () => {
    const { result } = renderHook(() => useFinancialGaps({ dateFrom: '2026-05-01', dateTo: '' }), {
      wrapper: createWrapper(),
    })

    expect(mockGetGaps).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(true)
  })

  it('returns loading state initially', () => {
    mockGetGaps.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(
      () => useFinancialGaps({ dateFrom: '2026-05-01', dateTo: '2026-05-31' }),
      { wrapper: createWrapper() }
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('returns error on API failure', async () => {
    mockGetGaps.mockRejectedValue(new Error('Gaps fetch failed'))

    const { result } = renderHook(
      () => useFinancialGaps({ dateFrom: '2026-05-01', dateTo: '2026-05-31' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Gaps fetch failed')
  })

  it('returns empty gaps list', async () => {
    mockGetGaps.mockResolvedValueOnce({ gaps: [], total: 0 } as never)

    const { result } = renderHook(
      () => useFinancialGaps({ dateFrom: '2026-05-01', dateTo: '2026-05-31' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.gaps).toEqual([])
    expect(result.current.data?.total).toBe(0)
  })
})

describe('useAnalyzeGap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls analyzeGap with missingDate', async () => {
    mockAnalyzeGap.mockResolvedValueOnce({
      missing_date: '2026-05-15',
      evidence: [],
      suggested_action: 'reimport' as never,
    } as never)

    const { result } = renderHook(() => useAnalyzeGap(), { wrapper: createWrapper() })

    result.current.mutate('2026-05-15')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockAnalyzeGap).toHaveBeenCalledWith('2026-05-15')
  })

  it('handles error', async () => {
    mockAnalyzeGap.mockRejectedValueOnce(new Error('Analysis failed'))

    const { result } = renderHook(() => useAnalyzeGap(), { wrapper: createWrapper() })

    result.current.mutate('2026-05-15')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Analysis failed')
  })
})

describe('useRemediateGap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls remediateGap with payload', async () => {
    mockRemediateGap.mockResolvedValueOnce({
      success: true,
      message: 'Remediation queued',
    } as never)

    const { result } = renderHook(
      () => useRemediateGap({ dateFrom: '2026-05-01', dateTo: '2026-05-31' }),
      { wrapper: createWrapper() }
    )

    result.current.mutate({
      missing_date: '2026-05-15',
      action: 'reimport' as never,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockRemediateGap).toHaveBeenCalledWith({
      missing_date: '2026-05-15',
      action: 'reimport' as never,
    })
  })

  it('handles error', async () => {
    mockRemediateGap.mockRejectedValueOnce(new Error('Remediation failed'))

    const { result } = renderHook(
      () => useRemediateGap({ dateFrom: '2026-05-01', dateTo: '2026-05-31' }),
      { wrapper: createWrapper() }
    )

    result.current.mutate({
      missing_date: '2026-05-15',
      action: 'reimport' as never,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Remediation failed')
  })
})
