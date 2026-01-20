/**
 * Unit tests for Price Calculator API Client
 * Story 44.1-FE: TypeScript Types & API Client
 * Epic 44: Price Calculator UI (Frontend)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculatePrice } from '../price-calculator'
import { apiClient } from '@/lib/api-client'
import type { PriceCalculatorRequest } from '@/types/price-calculator'
import {
  mockPriceCalculatorRequest,
  mockMinimalPriceCalculatorRequest,
  mockPriceCalculatorRequestWithOverrides,
  mockPriceCalculatorResponse,
  mockPriceCalculatorResponseWithWarnings,
} from '@/test/fixtures/price-calculator'

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

// Mock console.info to reduce test noise
vi.spyOn(console, 'info').mockImplementation(() => {})

describe('Price Calculator API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculatePrice', () => {
    it('calls API with correct endpoint and request body', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockPriceCalculatorResponse)

      await calculatePrice(mockPriceCalculatorRequest)

      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/products/price-calculator',
        mockPriceCalculatorRequest
      )
    })

    it('sends minimal request with only required fields', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockPriceCalculatorResponse)

      await calculatePrice(mockMinimalPriceCalculatorRequest)

      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/products/price-calculator',
        mockMinimalPriceCalculatorRequest
      )
    })

    it('includes optional fields when provided', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockPriceCalculatorResponse)

      await calculatePrice(mockPriceCalculatorRequest)

      const requestObject = vi.mocked(apiClient.post).mock.calls[0][1]
      expect(requestObject).toHaveProperty('vat_pct', 20)
      expect(requestObject).toHaveProperty('acquiring_pct', 1.5)
      expect(requestObject).toHaveProperty('commission_pct', 10.0)
    })

    it('includes overrides when provided', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockPriceCalculatorResponse)

      await calculatePrice(mockPriceCalculatorRequestWithOverrides)

      const requestObject = vi.mocked(apiClient.post).mock.calls[0][1] as PriceCalculatorRequest
      expect(requestObject).toHaveProperty('overrides')
      expect(requestObject.overrides).toEqual({
        commission_pct: 8.0,
        nm_id: 147205694,
      })
    })

    it('returns calculation result on success', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockPriceCalculatorResponse)

      const result = await calculatePrice(mockPriceCalculatorRequest)

      expect(result).toEqual(mockPriceCalculatorResponse)
      expect(result.result.recommended_price).toBe(2500.0)
      expect(result.result.actual_margin_pct).toBe(20.0)
    })

    it('returns response with warnings when backend provides them', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockPriceCalculatorResponseWithWarnings)

      const result = await calculatePrice(mockPriceCalculatorRequest)

      expect(result.warnings).toHaveLength(2)
      expect(result.warnings[0]).toContain('Target margin may not be achievable')
    })

    it('includes cost breakdown in response', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockPriceCalculatorResponse)

      const result = await calculatePrice(mockPriceCalculatorRequest)

      expect(result.cost_breakdown).toBeDefined()
      expect(result.cost_breakdown.cogs).toBe(1500.0)
      expect(result.cost_breakdown.logistics_total).toBe(203.0)
      expect(result.percentage_breakdown.commission_wb).toBe(250.0)
    })

    it('includes intermediate values in response', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockPriceCalculatorResponse)

      const result = await calculatePrice(mockPriceCalculatorRequest)

      expect(result.intermediate_values).toBeDefined()
      expect(result.intermediate_values.buyback_rate_pct).toBe(0.02)
      expect(result.intermediate_values.return_rate_pct).toBe(2.0)
    })

    it('logs calculation request info', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockPriceCalculatorResponse)

      await calculatePrice(mockPriceCalculatorRequest)

      expect(console.info).toHaveBeenCalledWith(
        '[Price Calculator] Calculating price:',
        expect.objectContaining({
          targetMargin: 20.0,
          cogs: 1500.0,
        })
      )
    })

    it('logs calculation result info', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockPriceCalculatorResponse)

      await calculatePrice(mockPriceCalculatorRequest)

      expect(console.info).toHaveBeenCalledWith(
        '[Price Calculator] Calculation result:',
        expect.objectContaining({
          recommendedPrice: 2500.0,
          actualMargin: 20.0,
        })
      )
    })

    it('logs warning count when warnings present', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockPriceCalculatorResponseWithWarnings)

      await calculatePrice(mockPriceCalculatorRequest)

      expect(console.info).toHaveBeenCalledWith(
        '[Price Calculator] Calculation result:',
        expect.objectContaining({
          warnings: 2,
        })
      )
    })

    it('throws ApiError on network failure', async () => {
      const networkError = new Error('Network error')
      vi.mocked(apiClient.post).mockRejectedValue(networkError)

      await expect(calculatePrice(mockPriceCalculatorRequest)).rejects.toThrow(
        'Network error'
      )
    })

    it('propagates API errors from backend', async () => {
      const apiError = new Error('VALIDATION_ERROR: Invalid input')
      vi.mocked(apiClient.post).mockRejectedValue(apiError)

      await expect(calculatePrice(mockPriceCalculatorRequest)).rejects.toThrow(
        'Invalid input'
      )
    })
  })

  describe('Request Structure', () => {
    it('sends target_margin_pct as number', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockPriceCalculatorResponse)

      await calculatePrice({
        ...mockMinimalPriceCalculatorRequest,
        target_margin_pct: 25.5,
      })

      const requestObject = vi.mocked(apiClient.post).mock.calls[0][1] as PriceCalculatorRequest
      expect(requestObject.target_margin_pct).toBe(25.5)
      expect(typeof requestObject.target_margin_pct).toBe('number')
    })

    it('sends all cost fields as numbers', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockPriceCalculatorResponse)

      await calculatePrice(mockPriceCalculatorRequest)

      const requestObject = vi.mocked(apiClient.post).mock.calls[0][1] as PriceCalculatorRequest
      expect(typeof requestObject.cogs_rub).toBe('number')
      expect(typeof requestObject.logistics_forward_rub).toBe('number')
      expect(typeof requestObject.logistics_reverse_rub).toBe('number')
      expect(typeof requestObject.storage_rub).toBe('number')
    })

    it('sends percentage fields as numbers', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockPriceCalculatorResponse)

      await calculatePrice(mockPriceCalculatorRequest)

      const requestObject = vi.mocked(apiClient.post).mock.calls[0][1] as PriceCalculatorRequest
      expect(typeof requestObject.buyback_pct).toBe('number')
      expect(typeof requestObject.advertising_pct).toBe('number')
      expect(typeof requestObject.vat_pct).toBe('number')
    })
  })
})
