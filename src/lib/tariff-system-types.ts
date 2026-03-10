/**
 * Tariff System Types and Constants
 * Story 44.40-FE: Two Tariff Systems Integration
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Extracted from tariff-system-utils.ts for file size compliance.
 *
 * @see docs/request-backend/108-two-tariff-systems-guide.md
 */

// ============================================================================
// Types
// ============================================================================

/** Tariff system type - determines data source */
export type TariffSystem = 'inventory' | 'supply'

/** Supply date tariffs - full tariff data from SUPPLY system per date */
export interface SupplyDateTariffs {
  date: string
  warehouseId: number
  warehouseName: string
  /** -1 = unavailable, 0 = free, >=1 = multiplier */
  coefficient: number
  isAvailable: boolean
  allowUnload: boolean
  boxTypeId: number
  boxTypeName: string
  delivery: {
    coefficient: number
    baseLiterRub: number
    additionalLiterRub: number
  }
  storage: {
    coefficient: number
    baseLiterRub: number
    additionalLiterRub: number
  }
  isSortingCenter: boolean
}

/** Extracted tariffs from either system, normalized for calculation */
export interface ExtractedTariffs {
  deliveryBaseLiterRub: number
  deliveryPerLiterRub: number
  storageBaseLiterRub: number
  storagePerLiterRub: number
  /**
   * Logistics coefficient for CALCULATION (always 1.0 for SUPPLY since rates are pre-multiplied)
   * @see docs/request-backend/108-two-tariff-systems-guide.md
   */
  logisticsCoefficient: number
  /**
   * Storage coefficient for CALCULATION (always 1.0 for SUPPLY since rates are pre-multiplied)
   */
  storageCoefficient: number
  /**
   * Logistics coefficient for DISPLAY purposes (original from API)
   * Use this when showing coefficient to user, not for calculations
   */
  displayLogisticsCoefficient: number
  /**
   * Storage coefficient for DISPLAY purposes (original from API)
   */
  displayStorageCoefficient: number
  source: TariffSystem
  isAvailable?: boolean
}

// ============================================================================
// Constants
// ============================================================================

/** Default tariffs when no data available */
export const DEFAULT_TARIFFS: ExtractedTariffs = {
  deliveryBaseLiterRub: 46.0,
  deliveryPerLiterRub: 14.0,
  storageBaseLiterRub: 0.07,
  storagePerLiterRub: 0.05,
  logisticsCoefficient: 1.0,
  storageCoefficient: 1.0,
  displayLogisticsCoefficient: 1.0,
  displayStorageCoefficient: 1.0,
  source: 'inventory',
}

/** SUPPLY system covers 14 days ahead */
export const SUPPLY_WINDOW_DAYS = 14
