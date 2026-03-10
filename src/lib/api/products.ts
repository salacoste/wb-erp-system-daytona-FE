/**
 * Products API module for Price Calculator
 * Story 44.26a-FE: Product Search & Delivery Date Selection
 * Backend: Epic 45 - Products Dimensions & Category API
 *
 * Raw types and normalization: see products-normalizer.ts
 */

import { apiClient } from '@/lib/api-client'
import type { ProductsWithDimensionsResponse, ProductWithDimensions } from '@/types/product'
import {
  normalizeProduct,
  type RawProduct,
  type RawProductList,
  type RawProductsResponse,
} from './products-normalizer'

// ============================================================================
// Query Parameters
// ============================================================================

export interface ProductsWithDimensionsParams {
  /** Search query (min 2 chars) */
  q?: string
  /** Max results (default: 50) */
  limit?: number
  /** Cursor for pagination */
  cursor?: string
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch products with dimensions for Price Calculator product selection
 * Backend: GET /v1/products?include_dimensions=true
 *
 * @param params - Query parameters
 * @returns Products with dimensions and category data
 *
 * Bug fix: Handles both response formats:
 * - Direct: { products: [...], pagination: {...} }
 * - Wrapped: { data: { products: [...], pagination: {...} } }
 */
export async function getProductsWithDimensions(
  params: ProductsWithDimensionsParams = {}
): Promise<ProductsWithDimensionsResponse> {
  const queryParams = new URLSearchParams()

  // Always include dimensions for Price Calculator
  queryParams.append('include_dimensions', 'true')

  if (params.q && params.q.length >= 2) {
    queryParams.append('q', params.q)
  }

  if (params.limit !== undefined) {
    queryParams.append('limit', String(params.limit))
  }

  if (params.cursor) {
    queryParams.append('cursor', params.cursor)
  }

  const rawResponse = await apiClient.get<RawProductsResponse>(
    `/v1/products?${queryParams.toString()}`,
    { skipDataUnwrap: true }
  )

  // DEBUG: Log raw API response to diagnose dimensions/category issue
  console.log('[Products API] Raw response structure:', {
    hasData: !!rawResponse.data,
    hasProducts: !!rawResponse.products,
    rawKeys: Object.keys(rawResponse),
  })

  // Normalize response: handle both direct and wrapped formats
  // Bug fix: Backend may wrap response in `data` field
  const unwrappedResponse: RawProductList =
    rawResponse.data && 'products' in rawResponse.data
      ? rawResponse.data
      : {
          products: rawResponse.products ?? [],
          pagination: rawResponse.pagination ?? {
            next_cursor: null,
            has_more: false,
            count: 0,
            total: 0,
          },
        }

  // Normalize products to ensure consistent field names
  // Backend may return fields with different casing or names
  const normalizedProducts = unwrappedResponse.products.map(normalizeProduct)

  const response: ProductsWithDimensionsResponse = {
    products: normalizedProducts,
    pagination: unwrappedResponse.pagination,
  }

  // DEBUG: Log first product to see dimensions/category structure
  if (response.products.length > 0) {
    const firstProduct = response.products[0]
    const rawFirstProduct = unwrappedResponse.products[0]
    console.log('[Products API] First product BEFORE normalization:', {
      ...rawFirstProduct,
      _allKeys: Object.keys(rawFirstProduct || {}),
    })
    console.log('[Products API] First product AFTER normalization:', {
      nm_id: firstProduct.nm_id,
      sa_name: firstProduct.sa_name,
      dimensions: firstProduct.dimensions,
      category_hierarchy: firstProduct.category_hierarchy,
    })
  }

  return response
}

/**
 * Get single product with dimensions by nm_id
 * Backend: GET /v1/products/:nmId?include_dimensions=true
 */
export async function getProductWithDimensions(nmId: string): Promise<ProductWithDimensions> {
  const rawResponse = await apiClient.get<RawProduct>(
    `/v1/products/${nmId}?include_dimensions=true`
  )

  // DEBUG: Log raw product response
  console.log('[Products API] Single product raw response:', {
    nm_id: rawResponse.nm_id,
    dimensions: rawResponse.dimensions,
    category_hierarchy: rawResponse.category_hierarchy,
    _allKeys: Object.keys(rawResponse),
  })

  // Normalize to ensure consistent field names
  const normalized = normalizeProduct(rawResponse)

  console.log('[Products API] Single product normalized:', {
    nm_id: normalized.nm_id,
    dimensions: normalized.dimensions,
    category_hierarchy: normalized.category_hierarchy,
  })

  return normalized
}
