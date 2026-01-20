/**
 * Commission Types
 * Story 44.16-FE: Category Selection with Search
 * Epic 44: Price Calculator UI (Frontend)
 */

/**
 * Category commission data from WB API
 * Maps to GET /v1/tariffs/commissions response
 */
export interface CategoryCommission {
  /** Parent category ID - use this as category_id in price calculator */
  parentID: number
  /** Parent category name (e.g., "Одежда") */
  parentName: string
  /** Sub-category ID */
  subjectID: number
  /** Sub-category name (e.g., "Платья") */
  subjectName: string
  /** FBO commission % (Fulfillment by WB) */
  paidStorageKgvp: number
  /** FBS commission % (Fulfillment by Seller) - typically +3-4% vs FBO */
  kgvpMarketplace: number
  /** DBS commission % (Delivery by Seller) - future use */
  kgvpSupplier: number
  /** EDBS commission % (Express DBS) - future use */
  kgvpSupplierExpress: number
}

/**
 * Commissions API response metadata
 */
export interface CommissionsMeta {
  /** Total number of categories */
  total: number
  /** Whether response is from cache */
  cached: boolean
  /** Cache TTL in seconds (86400 = 24 hours) */
  cache_ttl_seconds: number
  /** ISO timestamp when data was fetched */
  fetched_at: string
}

/**
 * GET /v1/tariffs/commissions response
 */
export interface CommissionsResponse {
  /** Array of category commissions (7346 items) */
  commissions: CategoryCommission[]
  /** Response metadata */
  meta: CommissionsMeta
}
