/**
 * Price Calculator — Product Dimensions & Category Types (Backend Epic 45)
 * Extracted from shared.ts for file-size compliance.
 */

export interface ProductDimensionsMm {
  length_mm: number
  width_mm: number
  height_mm: number
  volume_liters: number
}

export interface CategoryHierarchy {
  subject_id: number
  subject_name: string
  parent_id: number | null
  parent_name: string | null
}

export interface ProductWithDimensions {
  nm_id: string
  vendor_code: string
  sa_name: string
  brand?: string
  photo_url?: string
  has_cogs?: boolean
  cogs?: {
    unit_cost_rub: number
    valid_from: string
  }
  dimensions?: ProductDimensionsMm | null
  category_hierarchy?: CategoryHierarchy | null
}

export interface ProductsWithDimensionsResponse {
  products: ProductWithDimensions[]
  pagination: {
    next_cursor: string | null
    has_more: boolean
    count: number
    total: number
  }
}

export interface GetProductsWithDimensionsParams {
  search?: string
  include_dimensions?: boolean
  include_cogs?: boolean
  include_storage?: boolean
  limit?: number
  cursor?: string
  skip_cache?: boolean
}
