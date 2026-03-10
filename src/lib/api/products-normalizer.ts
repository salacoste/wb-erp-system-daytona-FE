/**
 * Products Normalizer - Raw types and normalization logic
 * Extracted from products.ts for file size compliance (Epic 74)
 *
 * Handles conversion from raw backend API response formats
 * (snake_case/camelCase) to consistent frontend types.
 */

import type { ProductWithDimensions } from '@/types/product'

// ============================================================================
// Raw API Response Types
// ============================================================================

/** Raw pagination from API */
export interface RawPagination {
  next_cursor: string | null
  has_more: boolean
  count: number
  total: number
}

/** Raw API response containing products array */
export interface RawProductList {
  products: RawProduct[]
  pagination: RawPagination
}

/** Raw API response type that may have nested data field */
export interface RawProductsResponse {
  data?: RawProductList
  products?: RawProduct[]
  pagination?: RawPagination
}

/**
 * Raw product from backend API - may have different field names
 * Backend uses snake_case (nm_id) but some fields may vary
 */
export interface RawProduct {
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

// ============================================================================
// Normalization
// ============================================================================

/**
 * Normalize product from backend API to consistent frontend format
 * Handles both snake_case and camelCase field names
 */
export function normalizeProduct(raw: RawProduct): ProductWithDimensions {
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
