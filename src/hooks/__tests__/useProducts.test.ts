/**
 * Unit tests for useProducts, useProductDetail, useProductsCount hooks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useProducts, useProductDetail, useProductsCount } from '../useProducts'
import { ApiError } from '@/types/api'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn() },
}))

import { apiClient } from '@/lib/api-client'
const mockGet = vi.mocked(apiClient.get)

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

const mockProductsResponse = {
  products: [
    {
      nm_id: '12345678',
      sa_name: 'Футболка TestBrand',
      brand: 'TestBrand',
      has_cogs: true,
      current_margin_pct: 75,
    },
    {
      nm_id: '87654321',
      sa_name: 'Шорты TestBrand',
      brand: 'TestBrand',
      has_cogs: false,
      current_margin_pct: null,
    },
  ],
  pagination: { total: 2, page: 1, limit: 20, total_pages: 1 },
}

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches products list successfully', async () => {
    mockGet.mockResolvedValueOnce(mockProductsResponse)

    const { result } = renderHook(() => useProducts(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.products).toHaveLength(2)
    expect(result.current.data?.products[0].nm_id).toBe('12345678')
    expect(result.current.data?.pagination.total).toBe(2)
  })

  it('returns empty products on WB token error', async () => {
    const wbError = new ApiError('Invalid WB API token', 401)
    // Mock isWbTokenError getter
    Object.defineProperty(wbError, 'isWbTokenError', { get: () => true })
    mockGet.mockRejectedValueOnce(wbError)

    const { result } = renderHook(() => useProducts(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.products).toHaveLength(0)
    expect(result.current.data?.pagination.total).toBe(0)
  })

  it('handles fallback on 500 when include_margin is true', async () => {
    // First call: 500 error
    const serverError = new ApiError('Internal server error', 500)
    mockGet.mockRejectedValueOnce(serverError)
    // Fallback call: success without margin
    mockGet.mockResolvedValueOnce({
      products: mockProductsResponse.products.map(p => ({ ...p, current_margin_pct: null })),
      pagination: mockProductsResponse.pagination,
    })

    const { result } = renderHook(() => useProducts({ include_margin: true }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.marginUnavailable).toBe(true)
    expect(result.current.data?.products).toHaveLength(2)
  })

  it('handles API error', async () => {
    mockGet.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useProducts(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Network error')
  })

  it('handles empty products response', async () => {
    mockGet.mockResolvedValueOnce({
      products: [],
      pagination: { total: 0, page: 1, limit: 20, total_pages: 0 },
    })

    const { result } = renderHook(() => useProducts(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.products).toHaveLength(0)
  })

  it('passes filter params to API', async () => {
    mockGet.mockResolvedValueOnce(mockProductsResponse)

    renderHook(() => useProducts({ has_cogs: true, search: 'Футболка' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1))
    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('has_cogs=true')
    expect(url).toContain('q=')
  })
})

describe('useProductDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches single product detail successfully', async () => {
    const mockDetail = {
      nm_id: '12345678',
      sa_name: 'Футболка TestBrand',
      brand: 'TestBrand',
      has_cogs: true,
      current_margin_pct: 75,
    }
    mockGet.mockResolvedValueOnce(mockDetail)

    const { result } = renderHook(() => useProductDetail('12345678'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.nm_id).toBe('12345678')
  })

  it('is disabled when nmId is undefined', () => {
    const { result } = renderHook(() => useProductDetail(undefined), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('does not retry on WB token error', async () => {
    // ApiError.isWbTokenError getter checks status === 401 && message includes 'WB API token'
    const wbError = new ApiError('Invalid WB API token', 401)
    mockGet.mockRejectedValueOnce(wbError)

    const { result } = renderHook(() => useProductDetail('12345678'), {
      wrapper: createWrapper(),
    })

    // The hook catches WB token errors and returns undefined,
    // but TanStack Query v5 cannot store undefined as data.
    // The query settles (either error or success with void), and retry is suppressed.
    await waitFor(() => expect(result.current.isFetching).toBe(false), { timeout: 5000 })
    // Should NOT have retried
    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it('handles API error', async () => {
    mockGet.mockRejectedValue(new Error('Not found'))

    const { result } = renderHook(() => useProductDetail('invalid'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Not found')
  })
})

describe('useProductsCount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns total product count', async () => {
    mockGet.mockResolvedValueOnce({
      products: [],
      pagination: { total: 42, page: 1, limit: 1, total_pages: 42 },
    })

    const { result } = renderHook(() => useProductsCount(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(42)
  })

  it('returns 0 on WB token error', async () => {
    const wbError = new ApiError('Invalid WB API token', 401)
    Object.defineProperty(wbError, 'isWbTokenError', { get: () => true })
    mockGet.mockRejectedValueOnce(wbError)

    const { result } = renderHook(() => useProductsCount(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(0)
  })

  it('handles missing pagination gracefully', async () => {
    mockGet.mockResolvedValueOnce({ products: [] })

    const { result } = renderHook(() => useProductsCount(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(0)
  })

  it('handles API error', async () => {
    mockGet.mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useProductsCount(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Server error')
  })
})
