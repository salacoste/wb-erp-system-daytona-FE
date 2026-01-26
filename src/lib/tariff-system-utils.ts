/**
 * Tariff System Utilities
 * Story 44.40-FE: Two Tariff Systems Integration
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Determines which tariff system to use (INVENTORY vs SUPPLY) based on delivery date.
 * - INVENTORY: Current actual costs (/v1/tariffs/warehouses-with-tariffs)
 * - SUPPLY: 14-day forward planning (/v1/tariffs/acceptance/coefficients/all)
 *
 * @see docs/request-backend/108-two-tariff-systems-guide.md
 */

import { format, differenceInCalendarDays, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

import type { Warehouse, WarehouseTariffs } from '@/types/warehouse'
import type { AcceptanceCoefficient } from '@/types/tariffs'

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
  /** -1 = unavailable, 0 = free, ≥1 = multiplier */
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
const SUPPLY_WINDOW_DAYS = 14

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Determine which tariff system to use based on delivery date.
 *
 * @param deliveryDate - Selected delivery date (ISO string YYYY-MM-DD) or null
 * @returns 'inventory' for today/no date/past/beyond 14 days, 'supply' for 1-14 days ahead
 */
export function determineTariffSystem(deliveryDate: string | null): TariffSystem {
  if (!deliveryDate) return 'inventory'

  // Use parseISO for consistent date parsing (treats YYYY-MM-DD as local date)
  const today = new Date()
  const delivery = parseISO(deliveryDate)
  const diffDays = differenceInCalendarDays(delivery, today)

  // Past or today: use INVENTORY (actual costs)
  if (diffDays <= 0) return 'inventory'

  // 1-14 days ahead: use SUPPLY (planning rates)
  if (diffDays >= 1 && diffDays <= SUPPLY_WINDOW_DAYS) return 'supply'

  // Beyond 14 days: SUPPLY doesn't cover, fallback to INVENTORY
  return 'inventory'
}

/**
 * Check if date is within SUPPLY system's 14-day window.
 *
 * @param date - Date string (ISO YYYY-MM-DD)
 * @returns true if date is 1-14 days from today (Europe/Moscow timezone)
 */
export function isDateInSupplyWindow(date: string): boolean {
  // Use parseISO for consistent date parsing (treats YYYY-MM-DD as local date)
  const today = new Date()
  const targetDate = parseISO(date)
  const diffDays = differenceInCalendarDays(targetDate, today)

  return diffDays >= 1 && diffDays <= SUPPLY_WINDOW_DAYS
}

/**
 * Extract normalized tariffs from either INVENTORY or SUPPLY system.
 *
 * @param system - Target tariff system
 * @param inventoryWarehouse - Warehouse with INVENTORY tariffs (may be null)
 * @param supplyTariffs - SUPPLY tariffs for specific date (may be null)
 * @returns Normalized tariffs for calculation
 */
export function extractTariffs(
  system: TariffSystem,
  inventoryWarehouse: Warehouse | null,
  supplyTariffs: SupplyDateTariffs | null
): ExtractedTariffs {
  // SUPPLY system requested
  if (system === 'supply') {
    // Check if SUPPLY data is available and warehouse is accepting
    if (supplyTariffs && supplyTariffs.isAvailable && supplyTariffs.coefficient !== -1) {
      // CRITICAL: SUPPLY API returns rates ALREADY multiplied by coefficient!
      // Example: base=46₽, coefficient=1.65 → API returns baseLiterRub=75.9 (46×1.65)
      // So we use coefficient=1.0 for calculations to avoid double multiplication
      // @see docs/request-backend/108-two-tariff-systems-guide.md
      console.info('[extractTariffs] SUPPLY system: using coefficient=1.0 for calculation', {
        deliveryBase: supplyTariffs.delivery.baseLiterRub,
        originalCoeff: supplyTariffs.delivery.coefficient,
        calcCoeff: 1.0,
      })
      return {
        deliveryBaseLiterRub: supplyTariffs.delivery.baseLiterRub,
        deliveryPerLiterRub: supplyTariffs.delivery.additionalLiterRub,
        storageBaseLiterRub: supplyTariffs.storage.baseLiterRub,
        storagePerLiterRub: supplyTariffs.storage.additionalLiterRub,
        // Calculation coefficients = 1.0 (rates are pre-multiplied)
        logisticsCoefficient: 1.0,
        storageCoefficient: 1.0,
        // Display coefficients = original values for UI
        displayLogisticsCoefficient: supplyTariffs.delivery.coefficient,
        displayStorageCoefficient: supplyTariffs.storage.coefficient,
        source: 'supply',
        isAvailable: true,
      }
    }

    // SUPPLY unavailable (coeff=-1): indicate unavailability, fallback to INVENTORY
    if (supplyTariffs && supplyTariffs.coefficient === -1) {
      const inventory = extractFromInventory(inventoryWarehouse)
      return {
        ...inventory,
        isAvailable: false,
      }
    }

    // SUPPLY data null: fallback to INVENTORY
    console.warn('[extractTariffs] SUPPLY requested but supplyTariffs is null, falling back to INVENTORY')
    return extractFromInventory(inventoryWarehouse)
  }

  // INVENTORY system requested
  console.info('[extractTariffs] INVENTORY system requested')
  return extractFromInventory(inventoryWarehouse)
}

/**
 * Extract tariffs from INVENTORY warehouse data.
 * INVENTORY rates are RAW (not pre-multiplied), so coefficient IS applied in calculations
 */
function extractFromInventory(warehouse: Warehouse | null): ExtractedTariffs {
  if (!warehouse?.tariffs) {
    return { ...DEFAULT_TARIFFS }
  }

  const tariffs: WarehouseTariffs = warehouse.tariffs
  const logisticsCoeff = tariffs.logisticsCoefficient ?? 1.0
  const storageCoeff = tariffs.storageCoefficient ?? 1.0

  return {
    deliveryBaseLiterRub: tariffs.deliveryBaseLiterRub,
    deliveryPerLiterRub: tariffs.deliveryPerLiterRub,
    storageBaseLiterRub: tariffs.storageBaseLiterRub,
    storagePerLiterRub: tariffs.storagePerLiterRub,
    // INVENTORY rates are RAW - apply coefficient in calculations
    logisticsCoefficient: logisticsCoeff,
    storageCoefficient: storageCoeff,
    // Display coefficients same as calculation coefficients for INVENTORY
    displayLogisticsCoefficient: logisticsCoeff,
    displayStorageCoefficient: storageCoeff,
    source: 'inventory',
  }
}

// ============================================================================
// UI Helper Functions
// ============================================================================

/**
 * Get human-readable label for tariff system.
 *
 * @param system - Active tariff system
 * @param date - Delivery date (for SUPPLY system display)
 * @returns Localized label string
 */
export function getTariffSystemLabel(system: TariffSystem, date: string | null): string {
  if (system === 'inventory') {
    return 'Текущие тарифы (Остатки)'
  }

  if (date) {
    const formattedDate = format(new Date(date), 'd MMM', { locale: ru })
    return `Тарифы на ${formattedDate}`
  }

  return 'Тарифы на дату поставки'
}

/**
 * Get badge variant for tariff system indicator.
 *
 * @param system - Active tariff system
 * @returns Badge variant: 'secondary' (gray) for inventory, 'default' (blue) for supply
 */
export function getTariffSystemBadgeVariant(system: TariffSystem): 'secondary' | 'default' {
  return system === 'inventory' ? 'secondary' : 'default'
}

/**
 * Find SUPPLY tariffs for a specific warehouse and date.
 *
 * @param coefficients - Array of acceptance coefficients from SUPPLY API
 * @param warehouseId - Target warehouse ID
 * @param date - Target date (ISO YYYY-MM-DD)
 * @returns SupplyDateTariffs or null if not found
 */
export function findSupplyTariffsForDate(
  coefficients: AcceptanceCoefficient[],
  warehouseId: number,
  date: string
): SupplyDateTariffs | null {
  const found = coefficients.find(c => c.warehouseId === warehouseId && c.date === date)

  if (!found) return null

  return {
    date: found.date,
    warehouseId: found.warehouseId,
    warehouseName: found.warehouseName,
    coefficient: found.coefficient,
    isAvailable: found.isAvailable,
    allowUnload: found.allowUnload,
    boxTypeId: found.boxTypeId,
    boxTypeName: found.boxTypeName,
    delivery: {
      coefficient: found.delivery.coefficient,
      baseLiterRub: found.delivery.baseLiterRub,
      additionalLiterRub: found.delivery.additionalLiterRub,
    },
    storage: {
      coefficient: found.storage.coefficient,
      baseLiterRub: found.storage.baseLiterRub,
      additionalLiterRub: found.storage.additionalLiterRub,
    },
    isSortingCenter: found.isSortingCenter,
  }
}
