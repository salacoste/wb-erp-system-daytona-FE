/**
 * Unit tests for useMarginPollingWithQuery hook
 * Story 4.8: Margin Recalculation Polling & Real-time Updates
 * Request #21: Lightweight margin-status endpoint (Epic 22)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useMarginPollingWithQuery, DEFAULT_POLLING_STRATEGY } from './useMarginPollingWithQuery'
import { apiClient } from '@/lib/api-client'
import * as api from '@/lib/api'
import type { ProductWithCogs, MarginCalculationStatusResponse } from '@/types/cogs'

// Mock apiClient
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

// Mock getMarginCalculationStatus
vi.mock('@/lib/api', () => ({
  getMarginCalculationStatus: vi.fn(),
}))

// Mock ProductWithCogs type
const createMockProduct = (
  nmId: string,
  hasMargin: boolean,
): ProductWithCogs => ({
  nm_id: nmId,
  sa_name: 'Test Product',
  has_cogs: true,
  cogs: {
    id: 'cogs-123',
    unit_cost_rub: '1250.50',
    valid_from: '2025-01-01',
    valid_to: null,
  },
  current_margin_pct: hasMargin ? 12.5 : null,
  current_margin_period: hasMargin ? '2025-W01' : null,
  current_margin_sales_qty: hasMargin ? 100 : null,
  current_margin_revenue: hasMargin ? 10000 : null,
  missing_data_reason: hasMargin ? null : 'COGS_NOT_ASSIGNED',
  last_sale_date: '2025-01-15',
  total_sales_qty: 500,
})

// Helper to create QueryClient wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    )
  Wrapper.displayName = 'QueryClientWrapper'
  return Wrapper
}

describe('useMarginPollingWithQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('polling behavior', () => {
    it('should not start polling when enabled is false', () => {
      const onSuccess = vi.fn()
      const onTimeout = vi.fn()

      const { result } = renderHook(
        () =>
          useMarginPollingWithQuery({
            nmId: '12345678',
            enabled: false,
            strategy: DEFAULT_POLLING_STRATEGY,
            onSuccess,
            onTimeout,
          }),
        { wrapper: createWrapper() },
      )

      expect(result.current.isPolling).toBe(false)
      expect(api.getMarginCalculationStatus).not.toHaveBeenCalled()
    })

    it('should not start polling when nmId is empty', () => {
      const onSuccess = vi.fn()

      const { result } = renderHook(
        () =>
          useMarginPollingWithQuery({
            nmId: '',
            enabled: true,
            strategy: DEFAULT_POLLING_STRATEGY,
            onSuccess,
            onTimeout: vi.fn(),
          }),
        { wrapper: createWrapper() },
      )

      expect(result.current.isPolling).toBe(false)
      expect(api.getMarginCalculationStatus).not.toHaveBeenCalled()
    })

    it('should start polling when enabled is true and nmId is provided', async () => {
      const statusResponse: MarginCalculationStatusResponse = { status: 'pending' }
      ;(api.getMarginCalculationStatus as ReturnType<typeof vi.fn>).mockResolvedValue(statusResponse)

      renderHook(
        () =>
          useMarginPollingWithQuery({
            nmId: '12345678',
            enabled: true,
            strategy: {
              interval: 100,
              maxAttempts: 3,
              estimatedTime: 5000,
            },
            onSuccess: vi.fn(),
            onTimeout: vi.fn(),
          }),
        { wrapper: createWrapper() },
      )

      // Wait for first poll
      await waitFor(
        () => {
          expect(api.getMarginCalculationStatus).toHaveBeenCalledWith('12345678')
        },
        { timeout: 1000 },
      )
    })

    it('should call onSuccess when status is completed and margin is available', async () => {
      const onSuccess = vi.fn()
      let callCount = 0

      // First call: pending, second call: completed
      ;(api.getMarginCalculationStatus as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++
        return Promise.resolve({
          status: callCount >= 2 ? 'completed' : 'pending',
        } as MarginCalculationStatusResponse)
      })

      // When status is completed, fetch full product
      ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockProduct('12345678', true), // Margin available
      )

      const { result } = renderHook(
        () =>
          useMarginPollingWithQuery({
            nmId: '12345678',
            enabled: true,
            strategy: {
              interval: 100,
              maxAttempts: 5,
              estimatedTime: 5000,
            },
            onSuccess,
            onTimeout: vi.fn(),
          }),
        { wrapper: createWrapper() },
      )

      // Wait for margin to become available
      await waitFor(
        () => {
          expect(result.current.margin).toBe(12.5)
          expect(onSuccess).toHaveBeenCalledWith(12.5)
        },
        { timeout: 3000 },
      )
    })

    it('should call onTimeout when max attempts reached', async () => {
      const onTimeout = vi.fn()

      // Always return pending
      ;(api.getMarginCalculationStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 'pending',
      } as MarginCalculationStatusResponse)

      const { result } = renderHook(
        () =>
          useMarginPollingWithQuery({
            nmId: '12345678',
            enabled: true,
            strategy: {
              interval: 50,
              maxAttempts: 3, // Only 3 attempts
              estimatedTime: 1000,
            },
            onSuccess: vi.fn(),
            onTimeout,
          }),
        { wrapper: createWrapper() },
      )

      // Wait for timeout
      await waitFor(
        () => {
          expect(result.current.timeout).toBe(true)
          expect(onTimeout).toHaveBeenCalled()
        },
        { timeout: 3000 },
      )
    })

    it('should call onError when status is failed', async () => {
      const onError = vi.fn()

      ;(api.getMarginCalculationStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 'failed',
        error: 'Calculation failed due to server error',
      } as MarginCalculationStatusResponse)

      const { result } = renderHook(
        () =>
          useMarginPollingWithQuery({
            nmId: '12345678',
            enabled: true,
            strategy: DEFAULT_POLLING_STRATEGY,
            onSuccess: vi.fn(),
            onTimeout: vi.fn(),
            onError,
          }),
        { wrapper: createWrapper() },
      )

      // Wait for error
      await waitFor(
        () => {
          expect(result.current.error).not.toBeNull()
          expect(onError).toHaveBeenCalled()
        },
        { timeout: 1000 },
      )
    })
  })

  describe('fallback behavior', () => {
    it('should fallback to full product endpoint when margin-status returns 404', async () => {
      const { ApiError } = await import('@/types/api')

      // First call throws 404
      ;(api.getMarginCalculationStatus as ReturnType<typeof vi.fn>).mockRejectedValue(
        new ApiError('Not Found', 404, 'Endpoint not found'),
      )

      // Fallback: product has margin
      ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockProduct('12345678', true),
      )

      const onSuccess = vi.fn()

      renderHook(
        () =>
          useMarginPollingWithQuery({
            nmId: '12345678',
            enabled: true,
            strategy: {
              interval: 100,
              maxAttempts: 5,
              estimatedTime: 5000,
            },
            onSuccess,
            onTimeout: vi.fn(),
          }),
        { wrapper: createWrapper() },
      )

      // Wait for fallback to complete
      await waitFor(
        () => {
          expect(apiClient.get).toHaveBeenCalledWith(
            '/v1/products/12345678?include_cogs=true',
          )
        },
        { timeout: 2000 },
      )
    })
  })
})
