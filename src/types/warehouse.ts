/**
 * Warehouse Types
 * Story 44.12-FE: Warehouse Selection Dropdown
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Types for warehouse selection and tariff parsing from WB API
 */

/**
 * Raw warehouse from WB API response
 * Backend returns tariffs as expression strings (e.g., "48*1", "5*x")
 */
export interface RawWarehouse {
  warehouseID: number
  warehouseName: string
  /** Combined delivery and storage expression (e.g., "48*1+5*x") */
  boxDeliveryAndStorageExpr: string
  /** Base delivery tariff for first liter (e.g., "48*1" = 48 RUB) */
  boxDeliveryBase: string
  /** Per-liter delivery tariff (e.g., "5*x" = 5 RUB per liter) */
  boxDeliveryLiter: string
  /** Base storage tariff for first liter per day (e.g., "1*1" = 1 RUB) */
  boxStorageBase: string
  /** Per-liter storage tariff per day (e.g., "1*x" = 1 RUB per liter) */
  boxStorageLiter: string
}

/**
 * Parsed warehouse tariffs with numeric values
 */
export interface WarehouseTariffs {
  /** First liter delivery cost (RUB) */
  deliveryBaseLiterRub: number
  /** Additional liter delivery cost (RUB) */
  deliveryPerLiterRub: number
  /** First liter storage cost per day (RUB) */
  storageBaseLiterRub: number
  /** Additional liter storage cost per day (RUB) */
  storagePerLiterRub: number
  /** Logistics coefficient (e.g., 1.6 = 160%) */
  logisticsCoefficient?: number
  /** Storage coefficient (e.g., 1.45 = 145%) */
  storageCoefficient?: number
}

/**
 * Parsed warehouse with numeric tariffs
 * Transformed from RawWarehouse for frontend use
 */
export interface Warehouse {
  id: number
  name: string
  tariffs: WarehouseTariffs
}

/**
 * Extended warehouse data from GET /v1/tariffs/warehouses-with-tariffs
 * Includes coefficients directly in the response
 */
export interface WarehouseWithTariffs {
  id: number
  name: string
  city?: string
  federal_district?: string | null
  cargo_type?: string
  tariffs: {
    fbo?: {
      delivery_base_rub: number
      delivery_liter_rub: number
      logistics_coefficient: number
    }
    fbs?: {
      delivery_base_rub: number
      delivery_liter_rub: number
      logistics_coefficient: number
    }
    storage?: {
      base_per_day_rub: number
      liter_per_day_rub: number
      coefficient: number
    }
    effective_from?: string
    effective_until?: string
  }
}

/**
 * Warehouses list response from GET /v1/tariffs/warehouses
 */
export interface WarehousesApiResponse {
  /** Start date for tariff validity */
  dtFromMin: string
  /** Next box tariff update date */
  dtNextBox: string
  /** Array of raw warehouses from WB API */
  warehouseList: RawWarehouse[]
}

/**
 * Popular warehouse IDs - most used warehouses
 * Shown at top of dropdown for quick access
 * Story 44.12 AC4: Popular Warehouses Section
 */
export const POPULAR_WAREHOUSE_IDS = [
  507, // Коледино
  117501, // Подольск
  117986, // Электросталь
  208699, // Казань
  218123, // Краснодар
] as const

export type PopularWarehouseId = (typeof POPULAR_WAREHOUSE_IDS)[number]

/**
 * Box tariffs response from GET /v1/tariffs/warehouses/box
 * Contains logistics and storage coefficients by warehouse name
 * Story 44.13-FE: Auto-fill Coefficients from Warehouse
 */
export interface BoxTariffItem {
  warehouseName: string
  geoName?: string
  logistics: {
    coefficient: number
    baseLiterRub: number
    additionalLiterRub: number
  }
  storage: {
    coefficient: number
    baseLiterRub: number
    additionalLiterRub: number
  }
}

export interface BoxTariffsResponse {
  tariffs: BoxTariffItem[]
  meta?: {
    date: string
    cached: boolean
    cache_ttl_seconds: number
  }
}
