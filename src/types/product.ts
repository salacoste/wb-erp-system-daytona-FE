/**
 * Product types for Price Calculator product selection
 * Story 44.26a-FE: Product Search & Delivery Date Selection
 * Backend: Epic 45 - Products Dimensions & Category API
 *
 * CRITICAL: Field names and types match ACTUAL backend implementation!
 * - nm_id is STRING (not number)
 * - Product name is sa_name (not title)
 * - Category is category_hierarchy (not category)
 * - volume_liters is pre-calculated by backend
 */

// ============================================================================
// Product Dimensions & Category Types (Epic 45 Backend)
// ============================================================================

/** Product dimensions from WB catalog (in mm) */
export interface ProductDimensions {
  length_mm: number
  width_mm: number
  height_mm: number
  /** Pre-calculated by backend: L×W×H / 1,000,000 */
  volume_liters: number
}

/** Category hierarchy from WB catalog */
export interface CategoryHierarchy {
  subject_id: number
  subject_name: string
  /** Null for top-level categories */
  parent_id: number | null
  parent_name: string | null
}

/**
 * Product with dimensions and category for Price Calculator
 * Backend: GET /v1/products?include_dimensions=true
 */
export interface ProductWithDimensions {
  /** STRING from backend (NOT number!) */
  nm_id: string
  vendor_code: string
  /** Product name (WB uses "sa_name", NOT "title") */
  sa_name: string
  brand?: string
  photo_url?: string
  has_cogs?: boolean
  cogs?: {
    unit_cost_rub: number
    valid_from: string
  }
  /** Product dimensions or null if not available */
  dimensions?: ProductDimensions | null
  /** Category hierarchy or null if not available */
  category_hierarchy?: CategoryHierarchy | null
}

// ============================================================================
// API Response Types
// ============================================================================

/** Products with dimensions API response */
export interface ProductsWithDimensionsResponse {
  products: ProductWithDimensions[]
  pagination: {
    next_cursor: string | null
    has_more: boolean
    count: number
    total: number
  }
}

// ============================================================================
// Product Selection Types (for Price Calculator)
// ============================================================================

/** Product selection state for form */
export interface ProductSelectionState {
  /** Selected product nm_id (STRING!) or null if none */
  nm_id: string | null
  /** Selected product name from sa_name */
  name: string
  /** Selected product vendor code */
  vendor_code?: string
  /** Full product data for auto-fill (Story 44.26b-FE) */
  product?: ProductWithDimensions | null
}
