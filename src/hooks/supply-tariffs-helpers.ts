/** Supply Tariffs Helpers — extracted from useSupplyTariffs.ts (Epic 74). Pure logic, no React. */

import type { AcceptanceCoefficient } from '@/types/tariffs'
import type { SupplyDateTariffs } from '@/lib/tariff-system-utils'
import { extractStorageTariffs } from '@/lib/tariff-extraction-utils'
import type { SupplyWarehouse, BoxTypeTariffs } from './supply-tariffs-types'

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

/** Extract unique warehouses from SUPPLY coefficients. Prefers boxTypeId: 2 (Boxes). */
export function extractSupplyWarehouses(coefficients: AcceptanceCoefficient[]): SupplyWarehouse[] {
  if (!coefficients.length) return []

  const warehouseMap = new Map<number, AcceptanceCoefficient>()
  // Prefer boxTypeId: 2 (Boxes) when collecting first coefficient
  coefficients.forEach(c => {
    if (!warehouseMap.has(c.warehouseId)) {
      warehouseMap.set(c.warehouseId, c)
    } else if (c.boxTypeId === 2 && warehouseMap.get(c.warehouseId)?.boxTypeId !== 2) {
      warehouseMap.set(c.warehouseId, c) // Prefer boxTypeId: 2
    }
  })

  return Array.from(warehouseMap.values())
    .map(c => {
      // Use extractStorageTariffs utility for proper fallback logic
      // Only triggers fallback when baseLiterRub=0, NOT when additionalLiterRub=0 (Pallets)
      const storageExtraction = extractStorageTariffs(c.storage, 'supply')

      // CRITICAL: SUPPLY API returns rates ALREADY multiplied by coefficient!
      // Example: base=46, coefficient=1.65 -> API returns baseLiterRub=75.9 (46*1.65)
      // So we use coefficient=1.0 for calculations to avoid double multiplication
      // @see docs/request-backend/108-two-tariff-systems-guide.md
      return {
        id: c.warehouseId,
        name: c.warehouseName,
        tariffs: {
          deliveryBaseLiterRub: c.delivery.baseLiterRub,
          deliveryPerLiterRub: c.delivery.additionalLiterRub,
          storageBaseLiterRub: storageExtraction.tariffs.baseLiterRub,
          storagePerLiterRub: storageExtraction.tariffs.additionalLiterRub,
          // Calculation coefficients = 1.0 (rates are pre-multiplied)
          logisticsCoefficient: 1.0,
          storageCoefficient: 1.0,
          // Display coefficients = original values for UI
          displayLogisticsCoefficient: c.delivery.coefficient,
          displayStorageCoefficient: storageExtraction.tariffs.coefficient,
          usingStorageFallback: storageExtraction.usingFallback,
        },
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}

/** Find tariffs for a specific warehouse ID and date. Prefers boxTypeId: 2, falls back to any. */
export function findTariffsForDateFromCoefficients(
  coefficients: AcceptanceCoefficient[],
  warehouseId: number,
  date: string
): SupplyDateTariffs | null {
  if (!coefficients.length) {
    console.warn('[findTariffsForDate] No coefficients loaded!')
    return null
  }

  const normalizedDate = date.split('T')[0] // Ensure YYYY-MM-DD format

  // Find matching coefficient (prefer boxTypeId: 2 = Boxes)
  const match = coefficients.find(
    c =>
      c.warehouseId === warehouseId && c.date.split('T')[0] === normalizedDate && c.boxTypeId === 2
  )

  // Fallback: any box type for this warehouse + date
  const fallbackMatch =
    match ??
    coefficients.find(c => c.warehouseId === warehouseId && c.date.split('T')[0] === normalizedDate)

  return fallbackMatch ? toSupplyDateTariffs(fallbackMatch) : null
}

/** Find tariffs by warehouse name and date (fuzzy: exact -> startsWith -> includes). */
export function findTariffsByNameFromCoefficients(
  coefficients: AcceptanceCoefficient[],
  warehouseName: string,
  date: string
): SupplyDateTariffs | null {
  if (!coefficients.length || !warehouseName) return null

  const normalizedDate = date.split('T')[0]
  const searchName = normalizeWarehouseName(warehouseName)

  // Strategy 1: Exact name match
  let match = coefficients.find(
    c =>
      normalizeWarehouseName(c.warehouseName) === searchName &&
      c.date.split('T')[0] === normalizedDate &&
      c.boxTypeId === 2
  )

  // Strategy 2: Name starts with search
  if (!match) {
    match = coefficients.find(
      c =>
        normalizeWarehouseName(c.warehouseName).startsWith(searchName) &&
        c.date.split('T')[0] === normalizedDate &&
        c.boxTypeId === 2
    )
  }

  // Strategy 3: Name contains search
  if (!match) {
    match = coefficients.find(
      c =>
        normalizeWarehouseName(c.warehouseName).includes(searchName) &&
        c.date.split('T')[0] === normalizedDate &&
        c.boxTypeId === 2
    )
  }

  return match ? toSupplyDateTariffs(match) : null
}

/** Get tariffs for all available box types for a warehouse (first available date). */
export function getTariffsByBoxTypeFromCoefficients(
  coefficients: AcceptanceCoefficient[],
  warehouseId: number
): BoxTypeTariffs[] {
  if (!coefficients.length) return []

  // Group by boxTypeId for this warehouse
  const boxTypeMap = new Map<number, AcceptanceCoefficient>()
  coefficients
    .filter(c => c.warehouseId === warehouseId)
    .forEach(c => {
      // Keep first entry for each box type
      if (!boxTypeMap.has(c.boxTypeId)) {
        boxTypeMap.set(c.boxTypeId, c)
      }
    })

  // Convert to BoxTypeTariffs array
  return Array.from(boxTypeMap.values())
    .map(c => ({
      boxTypeId: c.boxTypeId,
      boxTypeName: c.boxTypeName,
      delivery: {
        baseLiterRub: c.delivery.baseLiterRub,
        additionalLiterRub: c.delivery.additionalLiterRub,
        coefficient: c.delivery.coefficient,
      },
      storage: {
        baseLiterRub: c.storage.baseLiterRub,
        additionalLiterRub: c.storage.additionalLiterRub,
        coefficient: c.storage.coefficient,
      },
      // Pallets (boxTypeId: 5) use fixed storage formula
      isFixedStorage: c.boxTypeId === 5,
    }))
    .sort((a, b) => a.boxTypeId - b.boxTypeId)
}
