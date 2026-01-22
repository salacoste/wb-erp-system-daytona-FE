/**
 * Unit tests for Products API module
 * Story 44.26a-FE: Product Search & Delivery Date Selection
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Tests response normalization and data handling for products with dimensions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProductsWithDimensions } from '../products'
import { apiClient } from '@/lib/api-client'

// Mock the apiClient
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

describe('getProductsWithDimensions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // Response Normalization Tests (Bug Fix)
  // ==========================================================================

  describe('response normalization', () => {
    it('handles direct response format (products at root level)', async () => {
      const directResponse = {
        products: [
          {
            nm_id: '721654518',
            vendor_code: 'SP-001',
            sa_name: 'Шпатлевка',
            dimensions: {
              length_mm: 100,
              width_mm: 50,
              height_mm: 30,
              volume_liters: 0.15,
            },
            category_hierarchy: {
              subject_id: 123,
              subject_name: 'Авто',
              parent_id: 1,
              parent_name: 'Авто',
            },
          },
        ],
        pagination: {
          next_cursor: null,
          has_more: false,
          count: 1,
          total: 1,
        },
      }

      vi.mocked(apiClient.get).mockResolvedValue(directResponse)

      const result = await getProductsWithDimensions({ q: 'шпатлевка' })

      expect(result.products).toHaveLength(1)
      expect(result.products[0].nm_id).toBe('721654518')
      expect(result.products[0].dimensions).toBeDefined()
      expect(result.products[0].category_hierarchy).toBeDefined()
    })

    it('handles wrapped response format (products inside data field)', async () => {
      const wrappedResponse = {
        data: {
          products: [
            {
              nm_id: '721654518',
              vendor_code: 'SP-001',
              sa_name: 'Шпатлевка',
              dimensions: {
                length_mm: 100,
                width_mm: 50,
                height_mm: 30,
                volume_liters: 0.15,
              },
              category_hierarchy: {
                subject_id: 123,
                subject_name: 'Авто',
                parent_id: 1,
                parent_name: 'Авто',
              },
            },
          ],
          pagination: {
            next_cursor: null,
            has_more: false,
            count: 1,
            total: 1,
          },
        },
      }

      vi.mocked(apiClient.get).mockResolvedValue(wrappedResponse)

      const result = await getProductsWithDimensions({ q: 'шпатлевка' })

      // Should extract data from nested structure
      expect(result.products).toHaveLength(1)
      expect(result.products[0].nm_id).toBe('721654518')
      expect(result.products[0].dimensions).toBeDefined()
      expect(result.products[0].category_hierarchy).toBeDefined()
    })

    it('handles empty response gracefully', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({})

      const result = await getProductsWithDimensions({ q: 'nonexistent' })

      expect(result.products).toEqual([])
      expect(result.pagination).toEqual({
        next_cursor: null,
        has_more: false,
        count: 0,
        total: 0,
      })
    })

    it('handles response with missing pagination', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        products: [{ nm_id: '123', vendor_code: 'X', sa_name: 'Test' }],
      })

      const result = await getProductsWithDimensions({ q: 'test' })

      expect(result.products).toHaveLength(1)
      expect(result.pagination).toEqual({
        next_cursor: null,
        has_more: false,
        count: 0,
        total: 0,
      })
    })
  })

  // ==========================================================================
  // Dimensions & Category Data Tests
  // ==========================================================================

  describe('dimensions and category data preservation', () => {
    it('preserves dimensions data with all fields', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        products: [
          {
            nm_id: '123',
            vendor_code: 'X',
            sa_name: 'Test',
            dimensions: {
              length_mm: 400,
              width_mm: 300,
              height_mm: 50,
              volume_liters: 6.0,
            },
            category_hierarchy: null,
          },
        ],
        pagination: { next_cursor: null, has_more: false, count: 1, total: 1 },
      })

      const result = await getProductsWithDimensions({ q: 'test' })

      const dimensions = result.products[0].dimensions
      expect(dimensions?.length_mm).toBe(400)
      expect(dimensions?.width_mm).toBe(300)
      expect(dimensions?.height_mm).toBe(50)
      expect(dimensions?.volume_liters).toBe(6.0)
    })

    it('preserves category hierarchy data with all fields', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        products: [
          {
            nm_id: '123',
            vendor_code: 'X',
            sa_name: 'Test',
            dimensions: null,
            category_hierarchy: {
              subject_id: 105,
              subject_name: 'Платья',
              parent_id: 8,
              parent_name: 'Женская одежда',
            },
          },
        ],
        pagination: { next_cursor: null, has_more: false, count: 1, total: 1 },
      })

      const result = await getProductsWithDimensions({ q: 'test' })

      const category = result.products[0].category_hierarchy
      expect(category?.subject_id).toBe(105)
      expect(category?.subject_name).toBe('Платья')
      expect(category?.parent_id).toBe(8)
      expect(category?.parent_name).toBe('Женская одежда')
    })

    it('handles products with null dimensions correctly', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        products: [
          {
            nm_id: '123',
            vendor_code: 'X',
            sa_name: 'Test',
            dimensions: null,
            category_hierarchy: null,
          },
        ],
        pagination: { next_cursor: null, has_more: false, count: 1, total: 1 },
      })

      const result = await getProductsWithDimensions({ q: 'test' })

      expect(result.products[0].dimensions).toBeNull()
      expect(result.products[0].category_hierarchy).toBeNull()
    })
  })

  // ==========================================================================
  // Query Parameter Tests
  // ==========================================================================

  describe('query parameters', () => {
    it('always includes include_dimensions=true', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        products: [],
        pagination: { next_cursor: null, has_more: false, count: 0, total: 0 },
      })

      await getProductsWithDimensions({})

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('include_dimensions=true'),
        expect.any(Object)
      )
    })

    it('includes search query when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        products: [],
        pagination: { next_cursor: null, has_more: false, count: 0, total: 0 },
      })

      await getProductsWithDimensions({ q: 'платье' })

      // Query is URL-encoded (Cyrillic becomes %D0%BF%D0%BB%D0%B0%D1%82%D1%8C%D0%B5)
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('q='),
        expect.any(Object)
      )
      // Verify the actual URL includes the encoded query
      const calledUrl = vi.mocked(apiClient.get).mock.calls[0][0]
      expect(calledUrl).toContain('q=%D0%BF%D0%BB%D0%B0%D1%82%D1%8C%D0%B5') // URL-encoded "платье"
    })

    it('does not include search query when less than 2 chars', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        products: [],
        pagination: { next_cursor: null, has_more: false, count: 0, total: 0 },
      })

      await getProductsWithDimensions({ q: 'п' })

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.not.stringContaining('q='),
        expect.any(Object)
      )
    })

    it('includes limit when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        products: [],
        pagination: { next_cursor: null, has_more: false, count: 0, total: 0 },
      })

      await getProductsWithDimensions({ limit: 25 })

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=25'),
        expect.any(Object)
      )
    })

    it('uses skipDataUnwrap: true option', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        products: [],
        pagination: { next_cursor: null, has_more: false, count: 0, total: 0 },
      })

      await getProductsWithDimensions({})

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ skipDataUnwrap: true })
      )
    })
  })
})
