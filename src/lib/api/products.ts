/**
 * Products API module for Price Calculator
 * Story 44.26a-FE: Product Search & Delivery Date Selection
 * Backend: Epic 45 - Products Dimensions & Category API
 */

import { apiClient } from '@/lib/api-client'
import type {
  ProductsWithDimensionsResponse,
  ProductWithDimensions,
} from '@/types/product'

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

/** Raw pagination from API */
interface RawPagination {
  next_cursor: string | null
  has_more: boolean
  count: number
  total: number
}

/** Raw API response containing products array */
interface RawProductList {
  products: RawProduct[]
  pagination: RawPagination
}

/** Raw API response type that may have nested data field */
interface RawProductsResponse {
  data?: RawProductList
  products?: RawProduct[]
  pagination?: RawPagination
}

/**
 * Raw product from backend API - may have different field names
 * Backend uses snake_case (nm_id) but some fields may vary
 */
interface RawProduct {
  // Core fields (guaranteed)
  nm_id?: string
  nmId?: string // Alternative naming
  sa_name?: string
  saName?: string // Alternative naming
  vendor_code?: string
  vendorCode?: string // Alternative naming
  brand?: string
  photo_url?: string
  photoUrl?: string // Alternative naming
  has_cogs?: boolean
  hasCogs?: boolean // Alternative naming
  cogs?: { unit_cost_rub: number; valid_from: string }
  // Dimensions (Epic 45) - may be null even when product exists in WB
  dimensions?: {
    length_mm: number
    width_mm: number
    height_mm: number
    volume_liters: number
  } | null
  // Category hierarchy (Epic 45) - may be null
  category_hierarchy?: {
    subject_id: number
    subject_name: string
    parent_id: number | null
    parent_name: string | null
  } | null
  // Allow additional fields
  [key: string]: unknown
}

/**
 * Normalize product from backend API to consistent frontend format
 * Handles both snake_case and camelCase field names
 */
function normalizeProduct(raw: RawProduct): ProductWithDimensions {
  // Handle nm_id (backend uses snake_case, but may have camelCase)
  const nmId = String(raw.nm_id ?? raw.nmId ?? '')

  // Handle sa_name (product name)
  const saName = raw.sa_name ?? raw.saName ?? ''

  // Handle vendor_code
  const vendorCode = raw.vendor_code ?? raw.vendorCode ?? ''

  // Handle photo_url
  const photoUrl = raw.photo_url ?? raw.photoUrl

  // Handle has_cogs
  const hasCogs = raw.has_cogs ?? raw.hasCogs ?? false

  return {
    nm_id: nmId,
    vendor_code: vendorCode,
    sa_name: saName,
    brand: raw.brand,
    photo_url: photoUrl,
    has_cogs: hasCogs,
    cogs: raw.cogs,
    // Dimensions - keep as-is (already in correct format or null)
    dimensions: raw.dimensions ?? null,
    // Category hierarchy - keep as-is (already in correct format or null)
    category_hierarchy: raw.category_hierarchy ?? null,
  }
}

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
  params: ProductsWithDimensionsParams = {},
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
    { skipDataUnwrap: true },
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
export async function getProductWithDimensions(
  nmId: string,
): Promise<ProductWithDimensions> {
  const rawResponse = await apiClient.get<RawProduct>(
    `/v1/products/${nmId}?include_dimensions=true`,
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
