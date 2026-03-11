/**
 * Unit tests for Price Calculator hooks
 * Story 44.1-FE: TypeScript Types & API Client
 * Epic 44: Price Calculator UI (Frontend)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePriceCalculator, priceCalculatorQueryKeys } from '../usePriceCalculator'
import { createQueryWrapper } from '@/test/test-utils'
import {
  mockPriceCalculatorRequest,
  mockMinimalPriceCalculatorRequest,
  mockPriceCalculatorResponse,
  mockPriceCalculatorResponseWithWarnings,
} from '@/test/fixtures/price-calculator'

// Mock API client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

// Mock the calculatePrice function
vi.mock('../usePriceCalculator', async () => {
  const actual = await vi.importActual('../usePriceCalculator')
  return {
    ...actual,
    calculatePrice: vi.fn(),
  }
})

// Import mocked modules
import { apiClient } from '@/lib/api-client'

describe('Price Calculator Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==========================================================================
  // Query Keys Tests
  // ==========================================================================

  describe('priceCalculatorQueryKeys', () => {
    it('generates correct base key', () => {
      expect(priceCalculatorQueryKeys.all).toEqual(['price-calculator'])
    })

    it('generates correct calculate key with params', () => {
      const key = priceCalculatorQueryKeys.calculate(mockPriceCalculatorRequest)
      // Key uses getStableKey which returns JSON string for cache stability
      expect(key[0]).toBe('price-calculator')
      expect(key[1]).toBe('calculate')
      expect(typeof key[2]).toBe('string') // JSON stringified params
    })

    it('generates different keys for different requests', () => {
      const key1 = priceCalculatorQueryKeys.calculate(mockPriceCalculatorRequest)
      const key2 = priceCalculatorQueryKeys.calculate(mockMinimalPriceCalculatorRequest)
      expect(key1).not.toEqual(key2)
    })
  })

  // ==========================================================================
  // usePriceCalculator Tests
  // ==========================================================================

  describe('usePriceCalculator', () => {
    it('successfully calculates price with valid request', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockPriceCalculatorResponse)

      const onSuccess = vi.fn()
      const { result } = renderHook(
        () => usePriceCalculator({ onSuccess }),
        { wrapper: createQueryWrapper() }
      )

      result.current.mutate(mockPriceCalculatorRequest)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockPriceCalculatorResponse)
      expect(result.current.data?.result.recommended_price).toBe(2500.0)
      expect(result.current.data?.result.actual_margin_pct).toBe(20.0)
      expect(onSuccess).toHaveBeenCalledWith(mockPriceCalculatorResponse)
    })

    it('returns isPending state during mutation', async () => {
      vi.mocked(apiClient.post).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { result } = renderHook(
        () => usePriceCalculator(),
        { wrapper: createQueryWrapper() }
      )

      result.current.mutate(mockPriceCalculatorRequest)

      // Wait for mutation state to update
      await waitFor(() => expect(result.current.isPending).toBe(true))
    })

    it('returns error on API failure', async () => {
      const error = new Error('Calculation failed')
      vi.mocked(apiClient.post).mockRejectedValue(error)

      const onError = vi.fn()
      const { result } = renderHook(
        () => usePriceCalculator({ onError }),
        { wrapper: createQueryWrapper() }
      )

      result.current.mutate(mockPriceCalculatorRequest)

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual(error)
      expect(onError).toHaveBeenCalledWith(error)
    })

    it('calls onSuccess callback with response data', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockPriceCalculatorResponse)

      const onSuccess = vi.fn()
      const { result } = renderHook(
        () => usePriceCalculator({ onSuccess }),
        { wrapper: createQueryWrapper() }
      )

      result.current.mutate(mockPriceCalculatorRequest)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(onSuccess).toHaveBeenCalledTimes(1)
      expect(onSuccess).toHaveBeenCalledWith(mockPriceCalculatorResponse)
    })

    it('calls onError callback with error object', async () => {
      const error = new Error('Network error')
      vi.mocked(apiClient.post).mockRejectedValue(error)

      const onError = vi.fn()
      const { result } = renderHook(
        () => usePriceCalculator({ onError }),
        { wrapper: createQueryWrapper() }
      )

      result.current.mutate(mockPriceCalculatorRequest)

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(error)
    })

    it('works without callbacks', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockPriceCalculatorResponse)

      const { result } = renderHook(
        () => usePriceCalculator(),
        { wrapper: createQueryWrapper() }
      )

      result.current.mutate(mockPriceCalculatorRequest)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual(mockPriceCalculatorResponse)
    })

    it('handles response with warnings', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockPriceCalculatorResponseWithWarnings)

      const { result } = renderHook(
        () => usePriceCalculator(),
        { wrapper: createQueryWrapper() }
      )

      result.current.mutate(mockPriceCalculatorRequest)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.warnings).toHaveLength(2)
      expect(result.current.data?.warnings[0]).toContain('Target margin may not be achievable')
    })

    it('includes cost breakdown in response', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockPriceCalculatorResponse)

      const { result } = renderHook(
        () => usePriceCalculator(),
        { wrapper: createQueryWrapper() }
      )

      result.current.mutate(mockPriceCalculatorRequest)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.cost_breakdown).toBeDefined()
      expect(result.current.data?.cost_breakdown.cogs).toBe(1500.0)
      expect(result.current.data?.percentage_breakdown.margin).toBe(500.0)
    })

    it('includes intermediate values in response', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockPriceCalculatorResponse)

      const { result } = renderHook(
        () => usePriceCalculator(),
        { wrapper: createQueryWrapper() }
      )

      result.current.mutate(mockPriceCalculatorRequest)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.intermediate_values).toBeDefined()
      expect(result.current.data?.intermediate_values.buyback_rate_pct).toBe(0.02)
    })

    it('handles multiple sequential mutations', async () => {
      vi.mocked(apiClient.post)
        .mockResolvedValueOnce(mockPriceCalculatorResponse)
        .mockResolvedValueOnce(mockPriceCalculatorResponseWithWarnings)

      const { result } = renderHook(
        () => usePriceCalculator(),
        { wrapper: createQueryWrapper() }
      )

      // First mutation
      result.current.mutate(mockPriceCalculatorRequest)
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.warnings).toHaveLength(0)

      // Second mutation
      result.current.mutate(mockMinimalPriceCalculatorRequest)
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data?.warnings).toHaveLength(2)
    })

    it('resets error state on successful mutation after failure', async () => {
      vi.mocked(apiClient.post)
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce(mockPriceCalculatorResponse)

      const { result } = renderHook(
        () => usePriceCalculator(),
        { wrapper: createQueryWrapper() }
      )

      // First mutation fails
      result.current.mutate(mockPriceCalculatorRequest)
      await waitFor(() => expect(result.current.isError).toBe(true))

      // Second mutation succeeds
      result.current.mutate(mockPriceCalculatorRequest)
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.isError).toBe(false)
    })
  })
})
