/**
 * Unit tests for useProductLifecycle hooks (discontinued assortment management).
 * Covers: query fetch, cabinetId-gating (enabled), and mutation → cache invalidation.
 * Pattern matches useProducts.test.ts (mock apiClient + authStore, renderHook).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useDiscontinuedProducts,
  useDiscontinuedSuggestions,
  useUpdateProductLifecycle,
} from '../useProductLifecycle'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}))

const authState = { cabinetId: 'cab-1' as string | null }
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (s: { cabinetId: string | null }) => unknown) =>
    selector(authState)
  ),
}))

vi.mock('@/lib/logger', () => ({ logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() } }))

import { apiClient } from '@/lib/api-client'
const mockGet = vi.mocked(apiClient.get)
const mockPatch = vi.mocked(apiClient.patch)

const rawItem = {
  id: 'uuid-1',
  nmId: 12345678,
  vendorCode: 'ART-001',
  imtId: 9,
  brand: 'BrandX',
  subject: 'Телефоны',
  isDiscontinued: true,
  discontinuedAt: '2026-01-01T00:00:00Z',
  discontinuedBy: 'u1',
  discontinuedSuggestedAt: null,
  discontinuedReason: 'manual',
}

function withQC(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('useProductLifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.cabinetId = 'cab-1'
  })

  describe('useDiscontinuedProducts', () => {
    it('fetches and returns normalized discontinued products', async () => {
      mockGet.mockResolvedValueOnce([rawItem])
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const { result } = renderHook(() => useDiscontinuedProducts(), { wrapper: withQC(qc) })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockGet).toHaveBeenCalledWith('/v1/products/discontinued')
      expect(result.current.data).toHaveLength(1)
      expect(result.current.data?.[0].nmId).toBe(12345678)
    })

    it('is disabled (does not fetch) when cabinetId is null', async () => {
      authState.cabinetId = null
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      renderHook(() => useDiscontinuedProducts(), { wrapper: withQC(qc) })
      expect(mockGet).not.toHaveBeenCalled()
    })
  })

  describe('useDiscontinuedSuggestions', () => {
    it('GETs the suggestions endpoint', async () => {
      mockGet.mockResolvedValueOnce([rawItem])
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const { result } = renderHook(() => useDiscontinuedSuggestions(), { wrapper: withQC(qc) })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockGet).toHaveBeenCalledWith('/v1/products/discontinued-suggestions')
    })
  })

  describe('useUpdateProductLifecycle', () => {
    it('PATCHes lifecycle and invalidates both discontinued query keys', async () => {
      mockPatch.mockResolvedValueOnce(rawItem)
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
      const { result } = renderHook(() => useUpdateProductLifecycle(), { wrapper: withQC(qc) })

      await act(async () => {
        result.current.mutate({
          nmId: 12345678,
          status: 'discontinued',
          discontinuedAt: '2026-01-01',
        })
      })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(mockPatch).toHaveBeenCalledWith('/v1/products/12345678/lifecycle', {
        status: 'discontinued',
        discontinuedAt: '2026-01-01',
      })
      // Both the discontinued-products and discontinued-suggestions caches must be invalidated.
      const invalidatedKeys = invalidateSpy.mock.calls.map(c => c[0]?.queryKey)
      expect(invalidatedKeys).toEqual(
        expect.arrayContaining([
          ['products', 'discontinued', 'cab-1'],
          ['products', 'discontinued-suggestions', 'cab-1'],
        ])
      )
    })

    it('reactivate omits discontinuedAt in the payload', async () => {
      mockPatch.mockResolvedValueOnce({ ...rawItem, isDiscontinued: false, discontinuedAt: null })
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const { result } = renderHook(() => useUpdateProductLifecycle(), { wrapper: withQC(qc) })

      await act(async () => {
        result.current.mutate({ nmId: 12345678, status: 'active' })
      })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockPatch).toHaveBeenCalledWith('/v1/products/12345678/lifecycle', {
        status: 'active',
      })
    })
  })
})
