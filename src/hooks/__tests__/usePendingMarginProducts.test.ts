/**
 * Unit tests for usePendingMarginProducts hook
 * Tests: pending detection, tracking state, enabled gate, helper methods
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { usePendingMarginProducts } from '../usePendingMarginProducts'

// Mock the polling effect to avoid interval side effects in tests
vi.mock('../usePendingMarginPolling', () => ({
  usePendingMarginPollingEffect: vi.fn(),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

/** Shared type for test product fixtures to allow rerender with different margin states */
interface TestProduct {
  nm_id: string
  current_margin_pct: number | null
  missing_data_reason: string | null
  has_cogs: boolean
  cogs: { valid_from: string } | null
}

/** Product with pending margin: null margin, null reason, has COGS, valid_from present */
const pendingProduct = (nmId: string, validFrom = '2025-01-01'): TestProduct => ({
  nm_id: nmId,
  current_margin_pct: null,
  missing_data_reason: null,
  has_cogs: true,
  cogs: { valid_from: validFrom },
})

/** Product with calculated margin (not pending) */
const resolvedProduct = (nmId: string, margin = 15.5): TestProduct => ({
  nm_id: nmId,
  current_margin_pct: margin,
  missing_data_reason: null,
  has_cogs: true,
  cogs: { valid_from: '2025-01-01' },
})

/** Product with no COGS (not pending) */
const noCogsProduct = (nmId: string): TestProduct => ({
  nm_id: nmId,
  current_margin_pct: null,
  missing_data_reason: null,
  has_cogs: false,
  cogs: null,
})

describe('usePendingMarginProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('detects products with pending margin calculation', async () => {
    const products = [pendingProduct('123'), pendingProduct('456')]
    const { result } = renderHook(() => usePendingMarginProducts(products), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.pendingCount).toBe(2))
    expect(result.current.isPending('123')).toBe(true)
    expect(result.current.isPending('456')).toBe(true)
  })

  it('ignores products without COGS', async () => {
    const products = [noCogsProduct('123'), pendingProduct('456')]
    const { result } = renderHook(() => usePendingMarginProducts(products), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.pendingCount).toBe(1))
    expect(result.current.isPending('123')).toBe(false)
    expect(result.current.isPending('456')).toBe(true)
  })

  it('ignores products with calculated margin', async () => {
    const products = [resolvedProduct('123'), pendingProduct('456')]
    const { result } = renderHook(() => usePendingMarginProducts(products), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.pendingCount).toBe(1))
    expect(result.current.isPending('123')).toBe(false)
  })

  it('returns empty pending list when no pending products', async () => {
    const products = [resolvedProduct('123'), noCogsProduct('456')]
    const { result } = renderHook(() => usePendingMarginProducts(products), {
      wrapper: createWrapper(),
    })

    // Wait a tick for useEffect to settle
    await act(async () => {})
    expect(result.current.pendingCount).toBe(0)
    expect(result.current.pendingProducts).toEqual([])
  })

  it('detects nothing when enabled=false', async () => {
    const products = [pendingProduct('123')]
    const { result } = renderHook(() => usePendingMarginProducts(products, false), {
      wrapper: createWrapper(),
    })

    await act(async () => {})
    expect(result.current.pendingCount).toBe(0)
    expect(result.current.isPending('123')).toBe(false)
  })

  it('isPending returns false for unknown nmId', async () => {
    const products = [pendingProduct('123')]
    const { result } = renderHook(() => usePendingMarginProducts(products), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.pendingCount).toBe(1))
    expect(result.current.isPending('999')).toBe(false)
  })

  it('getPendingTime returns 0 for unknown nmId', async () => {
    const products = [pendingProduct('123')]
    const { result } = renderHook(() => usePendingMarginProducts(products), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.pendingCount).toBe(1))
    expect(result.current.getPendingTime('999')).toBe(0)
  })

  it('getPendingTime returns elapsed ms for pending product', async () => {
    const products = [pendingProduct('123')]
    const { result } = renderHook(() => usePendingMarginProducts(products), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.pendingCount).toBe(1))
    const elapsed = result.current.getPendingTime('123')
    expect(elapsed).toBeGreaterThanOrEqual(0)
    expect(elapsed).toBeLessThan(60_000)
  })

  it('shouldShowRetryButton returns false for newly detected products', async () => {
    const products = [pendingProduct('123')]
    const { result } = renderHook(() => usePendingMarginProducts(products), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.pendingCount).toBe(1))
    expect(result.current.shouldShowRetryButton('123')).toBe(false)
  })

  it('shouldShowRetryButton returns false for unknown nmId', async () => {
    const products = [pendingProduct('123')]
    const { result } = renderHook(() => usePendingMarginProducts(products), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.pendingCount).toBe(1))
    expect(result.current.shouldShowRetryButton('999')).toBe(false)
  })

  it('getAffectedWeeks returns empty array for unknown nmId', async () => {
    const products = [pendingProduct('123')]
    const { result } = renderHook(() => usePendingMarginProducts(products), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.pendingCount).toBe(1))
    expect(result.current.getAffectedWeeks('999')).toEqual([])
  })

  it('getAffectedWeeks returns week list for pending product', async () => {
    const products = [pendingProduct('123', '2020-01-01')]
    const { result } = renderHook(() => usePendingMarginProducts(products), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.pendingCount).toBe(1))
    const weeks = result.current.getAffectedWeeks('123')
    expect(weeks.length).toBeGreaterThanOrEqual(1)
  })

  it('removes product from pending when margin is resolved', async () => {
    const { result, rerender } = renderHook(({ products }) => usePendingMarginProducts(products), {
      wrapper: createWrapper(),
      initialProps: { products: [pendingProduct('123')] },
    })

    await waitFor(() => expect(result.current.pendingCount).toBe(1))

    // Rerender with the product now resolved
    rerender({ products: [resolvedProduct('123')] })

    await waitFor(() => expect(result.current.pendingCount).toBe(0))
    expect(result.current.isPending('123')).toBe(false)
  })

  it('ignores products with missing_data_reason but null margin', async () => {
    const products = [
      {
        nm_id: '123',
        current_margin_pct: null,
        missing_data_reason: 'no_sales',
        has_cogs: true,
        cogs: { valid_from: '2025-01-01' },
      },
    ]
    const { result } = renderHook(() => usePendingMarginProducts(products), {
      wrapper: createWrapper(),
    })

    await act(async () => {})
    expect(result.current.pendingCount).toBe(0)
  })
})
