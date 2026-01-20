/**
 * Tariffs Types
 * Story 44.16-FE: Category Selection with Search
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Commission types are in commissions.ts
 */

// Re-export commission types for convenience
export * from './commissions'

/**
 * Warehouse data from WB API
 * Maps to GET /v1/tariffs/warehouses response
 */
export interface Warehouse {
  id: number
  name: string
  address?: string
  city?: string
  federalDistrict?: string
  cargoType?: number
  deliveryType?: number
  latitude?: number
  longitude?: number
}

export interface WarehousesResponse {
  warehouses: Warehouse[]
  meta: { total: number; cached: boolean }
}

/** Delivery coefficient data */
export interface DeliveryCoefficient {
  coefficient: number
  baseLiterRub: number
  additionalLiterRub: number
}

/** Storage coefficient data */
export interface StorageCoefficient {
  coefficient: number
  baseLiterRub: number
  additionalLiterRub: number
}

/**
 * Acceptance coefficient data for a warehouse on a specific date
 * coefficient: -1 = Unavailable, 0 = Free, 1 = Standard, >1 = Increased
 */
export interface AcceptanceCoefficient {
  warehouseId: number
  warehouseName: string
  date: string
  coefficient: number
  isAvailable: boolean
  allowUnload: boolean
  boxTypeId: number
  boxTypeName: string
  delivery: DeliveryCoefficient
  storage: StorageCoefficient
  isSortingCenter: boolean
}

export interface AcceptanceCoefficientsResponse {
  coefficients: AcceptanceCoefficient[]
  meta: { total: number; available: number; unavailable: number; cache_ttl_seconds: number }
}

/** Volume tier for logistics calculation */
export interface VolumeTier {
  min: number
  max: number
  rate: number
}

/** Global tariff settings from GET /v1/tariffs/settings */
export interface TariffSettings {
  default_commission_fbo_pct: number
  default_commission_fbs_pct: number
  acceptance_box_rate_per_liter: number
  acceptance_pallet_rate: number
  logistics_volume_tiers: VolumeTier[]
  logistics_large_first_liter_rate: number
  logistics_large_additional_liter_rate: number
  return_logistics_fbo_rate: number
  return_logistics_fbs_rate: number
  storage_free_days: number
  fbs_uses_fbo_logistics_rates: boolean
  effective_from: string
}
