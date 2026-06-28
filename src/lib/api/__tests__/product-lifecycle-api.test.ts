/**
 * Unit tests for Product Lifecycle API Client (discontinued / «Снят с продажи»).
 * Covers:
 *  - Query-key cabinet-isolation (Story 97.5-FE: cabinetId-first keys prevent
 *    cross-cabinet cache collisions).
 *  - Boundary Normalizer (nullability preservation + field mapping — raw
 *    backend shape never escapes the API layer).
 *  - Endpoint + payload contracts for the GET/PATCH lifecycle calls.
 *
 * Pure-function / API-mock approach (no hook rendering) per the project's
 * "pure functions over hook mocking" convention.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  discontinuedProductsQueryKeys,
  discontinuedSuggestionsQueryKeys,
  getDiscontinuedProducts,
  getDiscontinuedSuggestions,
  updateProductLifecycle,
} from '../product-lifecycle-api'
import { apiClient } from '../../api-client'

vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

const mockGet = vi.mocked(apiClient.get)
const mockPatch = vi.mocked(apiClient.patch)

// Fully-populated backend item (camelCase, ISO dates, nmId as number).
const rawItem = {
  id: 'uuid-1',
  nmId: 12345678,
  vendorCode: 'ART-001',
  imtId: 99,
  brand: 'BrandX',
  subject: 'Телефоны',
  isDiscontinued: true,
  discontinuedAt: '2026-06-01T00:00:00Z',
  discontinuedBy: 'user-42',
  discontinuedSuggestedAt: '2026-05-20T00:00:00Z',
  discontinuedReason: 'no_sales_90d',
}

// Active SKU — every nullable field is null (the nullability edge that matters).
const rawItemNulls = {
  id: 'uuid-2',
  nmId: 998877,
  vendorCode: null,
  imtId: null,
  brand: null,
  subject: null,
  isDiscontinued: false,
  discontinuedAt: null,
  discontinuedBy: null,
  discontinuedSuggestedAt: null,
  discontinuedReason: null,
}

describe('product-lifecycle-api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('query-key factories (cabinet isolation — Story 97.5-FE)', () => {
    it('discontinued key is cabinet-scoped [products, discontinued, cabinetId]', () => {
      expect(discontinuedProductsQueryKeys.all('cab-A')).toEqual([
        'products',
        'discontinued',
        'cab-A',
      ])
    })

    it('different cabinets yield different keys (no cross-cabinet collision)', () => {
      const a = discontinuedProductsQueryKeys.all('cab-A')
      const b = discontinuedProductsQueryKeys.all('cab-B')
      expect(a).not.toEqual(b)
    })

    it('null cabinetId is preserved in the key (not coerced to undefined)', () => {
      expect(discontinuedProductsQueryKeys.all(null)).toEqual(['products', 'discontinued', null])
    })

    it('suggestions key is distinct from discontinued key for the same cabinet', () => {
      expect(discontinuedSuggestionsQueryKeys.all('cab-A')).not.toEqual(
        discontinuedProductsQueryKeys.all('cab-A')
      )
    })
  })

  describe('getDiscontinuedProducts', () => {
    it('GETs /v1/products/discontinued and normalizes the list', async () => {
      mockGet.mockResolvedValueOnce([rawItem])
      const result = await getDiscontinuedProducts()
      expect(mockGet).toHaveBeenCalledWith('/v1/products/discontinued')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'uuid-1',
        nmId: 12345678,
        vendorCode: 'ART-001',
        brand: 'BrandX',
        subject: 'Телефоны',
        isDiscontinued: true,
        discontinuedAt: '2026-06-01T00:00:00Z',
        discontinuedBy: 'user-42',
        discontinuedSuggestedAt: '2026-05-20T00:00:00Z',
        discontinuedReason: 'no_sales_90d',
      })
    })

    it('preserves nullable fields as null (no ?? coercion — Boundary Normalizer)', async () => {
      mockGet.mockResolvedValueOnce([rawItemNulls])
      const [item] = await getDiscontinuedProducts()
      expect(item.vendorCode).toBeNull()
      expect(item.brand).toBeNull()
      expect(item.subject).toBeNull()
      expect(item.discontinuedAt).toBeNull()
      expect(item.discontinuedBy).toBeNull()
      expect(item.discontinuedSuggestedAt).toBeNull()
      expect(item.discontinuedReason).toBeNull()
    })

    it('keeps nmId as a number (opaque id — anti-pattern #10: no formatNumber mangling)', async () => {
      mockGet.mockResolvedValueOnce([rawItem])
      const [item] = await getDiscontinuedProducts()
      expect(item.nmId).toBe(12345678)
      expect(typeof item.nmId).toBe('number')
    })

    it('returns [] for an empty list', async () => {
      mockGet.mockResolvedValueOnce([])
      expect(await getDiscontinuedProducts()).toEqual([])
    })
  })

  describe('getDiscontinuedSuggestions', () => {
    it('GETs /v1/products/discontinued-suggestions', async () => {
      mockGet.mockResolvedValueOnce([rawItem])
      await getDiscontinuedSuggestions()
      expect(mockGet).toHaveBeenCalledWith('/v1/products/discontinued-suggestions')
    })
  })

  describe('updateProductLifecycle', () => {
    it('PATCHes :nmId/lifecycle with {status, discontinuedAt} when discontinuedAt provided', async () => {
      mockPatch.mockResolvedValueOnce(rawItem)
      const result = await updateProductLifecycle(12345678, 'discontinued', '2026-06-01')
      expect(mockPatch).toHaveBeenCalledWith('/v1/products/12345678/lifecycle', {
        status: 'discontinued',
        discontinuedAt: '2026-06-01',
      })
      expect(result.nmId).toBe(12345678)
    })

    it('omits discontinuedAt from the payload when not provided (reactivate)', async () => {
      mockPatch.mockResolvedValueOnce(rawItemNulls)
      await updateProductLifecycle(998877, 'active')
      expect(mockPatch).toHaveBeenCalledWith('/v1/products/998877/lifecycle', {
        status: 'active',
      })
    })

    it('returns the normalized product', async () => {
      mockPatch.mockResolvedValueOnce(rawItem)
      const result = await updateProductLifecycle(12345678, 'discontinued', '2026-06-01')
      expect(result.id).toBe('uuid-1')
      expect(result.isDiscontinued).toBe(true)
    })
  })
})
