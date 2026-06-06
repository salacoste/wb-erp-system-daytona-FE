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
import { logger } from '@/lib/logger'

import type { Warehouse, WarehouseTariffs } from '@/types/warehouse'
import type { AcceptanceCoefficient } from '@/types/tariffs'

// Re-export types and constants from extracted module
export type { TariffSystem, SupplyDateTariffs, ExtractedTariffs } from './tariff-system-types'
export { DEFAULT_TARIFFS, SUPPLY_WINDOW_DAYS } from './tariff-system-types'

import type { TariffSystem, SupplyDateTariffs, ExtractedTariffs } from './tariff-system-types'
import { DEFAULT_TARIFFS, SUPPLY_WINDOW_DAYS } from './tariff-system-types'

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

  const today = new Date()
  const delivery = parseISO(deliveryDate)
  const diffDays = differenceInCalendarDays(delivery, today)

  if (diffDays <= 0) return 'inventory'
  if (diffDays >= 1 && diffDays <= SUPPLY_WINDOW_DAYS) return 'supply'
  return 'inventory'
}

/**
 * Check if date is within SUPPLY system's 14-day window.
 */
export function isDateInSupplyWindow(date: string): boolean {
  const today = new Date()
  const targetDate = parseISO(date)
  const diffDays = differenceInCalendarDays(targetDate, today)
  return diffDays >= 1 && diffDays <= SUPPLY_WINDOW_DAYS
}

/**
 * Extract normalized tariffs from either INVENTORY or SUPPLY system.
 */
export function extractTariffs(
  system: TariffSystem,
  inventoryWarehouse: Warehouse | null,
  supplyTariffs: SupplyDateTariffs | null
): ExtractedTariffs {
  if (system === 'supply') {
    if (supplyTariffs && supplyTariffs.isAvailable && supplyTariffs.coefficient !== -1) {
      logger.debug('[extractTariffs] SUPPLY system: using coefficient=1.0 for calculation', {
        deliveryBase: supplyTariffs.delivery.baseLiterRub,
        originalCoeff: supplyTariffs.delivery.coefficient,
        calcCoeff: 1.0,
      })
      return {
        deliveryBaseLiterRub: supplyTariffs.delivery.baseLiterRub,
        deliveryPerLiterRub: supplyTariffs.delivery.additionalLiterRub,
        storageBaseLiterRub: supplyTariffs.storage.baseLiterRub,
        storagePerLiterRub: supplyTariffs.storage.additionalLiterRub,
        logisticsCoefficient: 1.0,
        storageCoefficient: 1.0,
        displayLogisticsCoefficient: supplyTariffs.delivery.coefficient,
        displayStorageCoefficient: supplyTariffs.storage.coefficient,
        source: 'supply',
        isAvailable: true,
      }
    }

    if (supplyTariffs && supplyTariffs.coefficient === -1) {
      const inventory = extractFromInventory(inventoryWarehouse)
      return { ...inventory, isAvailable: false }
    }

    logger.warn(
      '[extractTariffs] SUPPLY requested but supplyTariffs is null, falling back to INVENTORY'
    )
    return extractFromInventory(inventoryWarehouse)
  }

  logger.debug('[extractTariffs] INVENTORY system requested')
  return extractFromInventory(inventoryWarehouse)
}

/** Extract tariffs from INVENTORY warehouse data. */
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
    logisticsCoefficient: logisticsCoeff,
    storageCoefficient: storageCoeff,
    displayLogisticsCoefficient: logisticsCoeff,
    displayStorageCoefficient: storageCoeff,
    source: 'inventory',
  }
}

// ============================================================================
// UI Helper Functions
// ============================================================================

/** Get human-readable label for tariff system. */
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

/** Get badge variant for tariff system indicator. */
export function getTariffSystemBadgeVariant(system: TariffSystem): 'secondary' | 'default' {
  return system === 'inventory' ? 'secondary' : 'default'
}

/** Find SUPPLY tariffs for a specific warehouse and date. */
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
