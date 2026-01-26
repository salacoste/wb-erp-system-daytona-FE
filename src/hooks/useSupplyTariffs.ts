/**
 * useSupplyTariffs Hook
 * Story 44.40-FE: Two Tariff Systems Integration
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Fetches and caches SUPPLY system tariffs from /acceptance/coefficients/all.
 * Provides findTariffsForDate function to get tariffs for specific warehouse + date.
 *
 * @see docs/request-backend/108-two-tariff-systems-guide.md
 * @see docs/stories/epic-44/story-44.40-fe-two-tariff-systems-integration.md
 */

import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { getAllAcceptanceCoefficients } from '@/lib/api/tariffs'
import type { AcceptanceCoefficient } from '@/types/tariffs'
import type { SupplyDateTariffs } from '@/lib/tariff-system-utils'
import { extractStorageTariffs } from '@/lib/tariff-extraction-utils'

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
    logisticsCoefficient: number
    storageCoefficient: number
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

/**
 * Transform AcceptanceCoefficient to SupplyDateTariffs
 */
function toSupplyDateTariffs(coeff: AcceptanceCoefficient): SupplyDateTariffs {
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

/**
 * Normalize warehouse name for matching
 */
function normalizeWarehouseName(name: string): string {
  return name.trim().toLowerCase()
}

/**
 * Hook to fetch and cache SUPPLY system tariffs
 *
 * Features:
 * - 1-hour cache (SUPPLY data is for 14-day planning window)
 * - Find tariffs by warehouse ID + date
 * - Find tariffs by warehouse name + date (fuzzy match)
 * - Returns full coefficient array for filtering
 *
 * @returns Query result with findTariffsForDate helper
 */
export function useSupplyTariffs(): UseSupplyTariffsReturn {
  const query = useQuery({
    queryKey: supplyTariffsQueryKeys.all,
    queryFn: async () => {
      const response = await getAllAcceptanceCoefficients()
      console.info('[SupplyTariffs] Loaded', response.coefficients?.length || 0, 'entries')

      // Debug: Log Краснодар entries to check boxTypeId and storage values
      const krasnodarEntries = response.coefficients?.filter(c =>
        c.warehouseName.includes('Тихорецк')
      ).slice(0, 5)
      if (krasnodarEntries?.length) {
        console.info('[SupplyTariffs] DEBUG Краснодар entries:', krasnodarEntries.map(e => ({
          date: e.date,
          boxTypeId: e.boxTypeId,
          boxTypeName: e.boxTypeName,
          delivery: e.delivery,
          storage: e.storage,
        })))
      }

      return response.coefficients || []
    },
    staleTime: 60 * 60 * 1000, // 1 hour cache
    gcTime: 2 * 60 * 60 * 1000, // 2 hours garbage collection
    refetchOnWindowFocus: false,
    retry: 2,
  })

  const coefficients = useMemo(() => query.data ?? [], [query.data])

  // Extract unique warehouses from SUPPLY coefficients with tariffs from first coefficient
  const warehouses = useMemo((): SupplyWarehouse[] => {
    if (!coefficients.length) return []

    const warehouseMap = new Map<number, AcceptanceCoefficient>()
    // Prefer boxTypeId: 2 (Boxes) when collecting first coefficient
    coefficients.forEach((c) => {
      if (!warehouseMap.has(c.warehouseId)) {
        warehouseMap.set(c.warehouseId, c)
      } else if (c.boxTypeId === 2 && warehouseMap.get(c.warehouseId)?.boxTypeId !== 2) {
        warehouseMap.set(c.warehouseId, c) // Prefer boxTypeId: 2
      }
    })

    const result = Array.from(warehouseMap.values())
      .map((c) => {
        // Use extractStorageTariffs utility for proper fallback logic
        // Only triggers fallback when baseLiterRub=0, NOT when additionalLiterRub=0 (Pallets)
        const storageExtraction = extractStorageTariffs(c.storage, 'supply')

        return {
          id: c.warehouseId,
          name: c.warehouseName,
          tariffs: {
            deliveryBaseLiterRub: c.delivery.baseLiterRub,
            deliveryPerLiterRub: c.delivery.additionalLiterRub,
            storageBaseLiterRub: storageExtraction.tariffs.baseLiterRub,
            storagePerLiterRub: storageExtraction.tariffs.additionalLiterRub,
            logisticsCoefficient: c.delivery.coefficient,
            storageCoefficient: storageExtraction.tariffs.coefficient,
            usingStorageFallback: storageExtraction.usingFallback,
          },
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))

    return result
  }, [coefficients])

  /**
   * Find tariffs for specific warehouse ID and date
   * Filters for default box type (boxTypeId: 2 = Boxes)
   */
  const findTariffsForDate = useCallback(
    (warehouseId: number, date: string): SupplyDateTariffs | null => {
      console.info('[findTariffsForDate] Searching:', {
        warehouseId,
        date,
        coefficientsCount: coefficients.length,
      })

      if (!coefficients.length) {
        console.warn('[findTariffsForDate] No coefficients loaded!')
        return null
      }

      const normalizedDate = date.split('T')[0] // Ensure YYYY-MM-DD format

      // Find matching coefficient (prefer boxTypeId: 2 = Boxes)
      const match = coefficients.find(
        (c) =>
          c.warehouseId === warehouseId &&
          c.date.split('T')[0] === normalizedDate &&
          c.boxTypeId === 2
      )

      // Fallback: any box type for this warehouse + date
      const fallbackMatch =
        match ??
        coefficients.find(
          (c) => c.warehouseId === warehouseId && c.date.split('T')[0] === normalizedDate
        )

      if (fallbackMatch) {
        console.info('[findTariffsForDate] Found match:', {
          warehouseId: fallbackMatch.warehouseId,
          date: fallbackMatch.date,
          boxTypeId: fallbackMatch.boxTypeId,
          deliveryBase: fallbackMatch.delivery.baseLiterRub,
          deliveryCoeff: fallbackMatch.delivery.coefficient,
        })
      } else {
        console.warn('[findTariffsForDate] No match found for warehouse', warehouseId, 'date', normalizedDate)
        // Log some available warehouseIds for debugging
        const uniqueIds = [...new Set(coefficients.map(c => c.warehouseId))].slice(0, 10)
        console.info('[findTariffsForDate] Available warehouseIds (first 10):', uniqueIds)
      }

      return fallbackMatch ? toSupplyDateTariffs(fallbackMatch) : null
    },
    [coefficients]
  )

  /**
   * Find tariffs by warehouse name and date (fuzzy match)
   * Used when warehouse IDs differ between systems
   */
  const findTariffsByNameAndDate = useCallback(
    (warehouseName: string, date: string): SupplyDateTariffs | null => {
      if (!coefficients.length || !warehouseName) return null

      const normalizedDate = date.split('T')[0]
      const searchName = normalizeWarehouseName(warehouseName)

      // Strategy 1: Exact name match
      let match = coefficients.find(
        (c) =>
          normalizeWarehouseName(c.warehouseName) === searchName &&
          c.date.split('T')[0] === normalizedDate &&
          c.boxTypeId === 2
      )

      // Strategy 2: Name starts with search
      if (!match) {
        match = coefficients.find(
          (c) =>
            normalizeWarehouseName(c.warehouseName).startsWith(searchName) &&
            c.date.split('T')[0] === normalizedDate &&
            c.boxTypeId === 2
        )
      }

      // Strategy 3: Name contains search
      if (!match) {
        match = coefficients.find(
          (c) =>
            normalizeWarehouseName(c.warehouseName).includes(searchName) &&
            c.date.split('T')[0] === normalizedDate &&
            c.boxTypeId === 2
        )
      }

      return match ? toSupplyDateTariffs(match) : null
    },
    [coefficients]
  )

  /**
   * Get tariffs for all available box types for a warehouse
   * Uses first available date's data for each box type
   */
  const getTariffsByBoxType = useCallback(
    (warehouseId: number): BoxTypeTariffs[] => {
      if (!coefficients.length) return []

      // Group by boxTypeId for this warehouse
      const boxTypeMap = new Map<number, AcceptanceCoefficient>()
      coefficients
        .filter((c) => c.warehouseId === warehouseId)
        .forEach((c) => {
          // Keep first entry for each box type
          if (!boxTypeMap.has(c.boxTypeId)) {
            boxTypeMap.set(c.boxTypeId, c)
          }
        })

      // Convert to BoxTypeTariffs array
      return Array.from(boxTypeMap.values())
        .map((c) => ({
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
    },
    [coefficients]
  )

  return {
    coefficients,
    warehouses,
    findTariffsForDate,
    findTariffsByNameAndDate,
    getTariffsByBoxType,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    isRefetching: query.isRefetching,
  }
}
