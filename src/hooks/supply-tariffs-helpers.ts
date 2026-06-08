/**
 * Supply Tariffs Helpers — extracted from useSupplyTariffs.ts (Epic 74). Pure logic, no React.
 *
 * Transform/normalize functions for acceptance coefficients.
 * Lookup/find functions live in supply-tariffs-lookup.ts.
 */

// Re-export lookup functions for backward compatibility
export {
  extractSupplyWarehouses,
  findTariffsForDateFromCoefficients,
  findTariffsByNameFromCoefficients,
  getTariffsByBoxTypeFromCoefficients,
} from './supply-tariffs-lookup'

import type { AcceptanceCoefficient } from '@/types/tariffs'
import type { SupplyDateTariffs } from '@/lib/tariff-system-utils'

/** Transform AcceptanceCoefficient to SupplyDateTariffs */
export function toSupplyDateTariffs(coeff: AcceptanceCoefficient): SupplyDateTariffs {
  return {
    date: coeff.date.split('T')[0], // Normalize to YYYY-MM-DD
    warehouseId: coeff.warehouseId,
    warehouseName: coeff.warehouseName,
    coefficient: coeff.coefficient,
    isAvailable: coeff.isAvailable,
    allowUnload: coeff.allowUnload,
    boxTypeId: coeff.boxTypeId,
    boxTypeName: coeff.boxTypeName,
    delivery: {
      coefficient: coeff.delivery.coefficient,
      baseLiterRub: coeff.delivery.baseLiterRub,
      additionalLiterRub: coeff.delivery.additionalLiterRub,
    },
    storage: {
      coefficient: coeff.storage.coefficient,
      baseLiterRub: coeff.storage.baseLiterRub,
      additionalLiterRub: coeff.storage.additionalLiterRub,
    },
    isSortingCenter: coeff.isSortingCenter,
  }
}

/** Normalize warehouse name for matching */
export function normalizeWarehouseName(name: string): string {
  return name.trim().toLowerCase()
}
