/**
 * Supply Tariffs Types & Query Keys
 * Extracted from useSupplyTariffs.ts for file size compliance (Epic 74).
 *
 * Types for SUPPLY system tariffs and query key definitions.
 * NO 'use client' — pure type/config file.
 *
 * @see docs/request-backend/108-two-tariff-systems-guide.md
 */

import type { AcceptanceCoefficient } from '@/types/tariffs'
import type { SupplyDateTariffs } from '@/lib/tariff-system-utils'

/** Query keys for supply tariffs */
export const supplyTariffsQueryKeys = {
  all: ['tariffs', 'supply', 'all'] as const,
}

/** Warehouse type from SUPPLY system with tariffs from first coefficient */
export interface SupplyWarehouse {
  id: number
  name: string
  /** Tariffs from first available coefficient for this warehouse */
  tariffs: {
    deliveryBaseLiterRub: number
    deliveryPerLiterRub: number
    storageBaseLiterRub: number
    storagePerLiterRub: number
    /**
     * Logistics coefficient for CALCULATION - always 1.0 for SUPPLY since rates are pre-multiplied.
     * @see docs/request-backend/108-two-tariff-systems-guide.md
     */
    logisticsCoefficient: number
    storageCoefficient: number
    /**
     * Original logistics coefficient for DISPLAY purposes (e.g., 1.65 for Krasnodar).
     * Use this when showing coefficient to user, not for calculations.
     */
    displayLogisticsCoefficient?: number
    /**
     * Original storage coefficient for DISPLAY purposes.
     */
    displayStorageCoefficient?: number
    /** True if storage tariffs are using fallback defaults (baseLiterRub was 0) */
    usingStorageFallback?: boolean
  }
}

/** Tariffs for a specific box type */
export interface BoxTypeTariffs {
  boxTypeId: number
  boxTypeName: string
  delivery: {
    baseLiterRub: number
    additionalLiterRub: number
    coefficient: number
  }
  storage: {
    baseLiterRub: number
    additionalLiterRub: number
    coefficient: number
  }
  /** True if storage uses fixed formula (Pallets) */
  isFixedStorage: boolean
}

/** Return type for useSupplyTariffs hook */
export interface UseSupplyTariffsReturn {
  /** Full coefficients array from API */
  coefficients: AcceptanceCoefficient[]
  /** Unique warehouses extracted from SUPPLY coefficients */
  warehouses: SupplyWarehouse[]
  /** Find tariffs for specific warehouse and date */
  findTariffsForDate: (warehouseId: number, date: string) => SupplyDateTariffs | null
  /** Find tariffs by warehouse name and date (fuzzy match) */
  findTariffsByNameAndDate: (warehouseName: string, date: string) => SupplyDateTariffs | null
  /** Get tariffs for all box types for a warehouse (first available date) */
  getTariffsByBoxType: (warehouseId: number) => BoxTypeTariffs[]
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Is data stale and refetching */
  isRefetching: boolean
}
