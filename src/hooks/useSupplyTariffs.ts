'use client'

/**
 * useSupplyTariffs Hook
 * Story 44.40-FE: Two Tariff Systems Integration
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Fetches and caches SUPPLY system tariffs from /acceptance/coefficients/all.
 * Provides findTariffsForDate function to get tariffs for specific warehouse + date.
 *
 * Types extracted to supply-tariffs-types.ts, helpers to supply-tariffs-helpers.ts (Epic 74).
 *
 * @see docs/request-backend/108-two-tariff-systems-guide.md
 * @see docs/stories/epic-44/story-44.40-fe-two-tariff-systems-integration.md
 */

import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { getAllAcceptanceCoefficients } from '@/lib/api/tariffs'
import type { SupplyDateTariffs } from '@/lib/tariff-system-utils'
import {
  supplyTariffsQueryKeys,
  type UseSupplyTariffsReturn,
  type SupplyWarehouse,
} from './supply-tariffs-types'
import {
  extractSupplyWarehouses,
  findTariffsForDateFromCoefficients,
  findTariffsByNameFromCoefficients,
  getTariffsByBoxTypeFromCoefficients,
} from './supply-tariffs-helpers'

// Re-export types and query keys for backward compatibility
export { supplyTariffsQueryKeys } from './supply-tariffs-types'
export type {
  UseSupplyTariffsReturn,
  SupplyWarehouse,
  BoxTypeTariffs,
} from './supply-tariffs-types'

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

      // Debug: Log entries to check boxTypeId and storage values
      const debugEntries = response.coefficients
        ?.filter(c => c.warehouseName.includes('Тихорецк'))
        .slice(0, 5)
      if (debugEntries?.length) {
        console.info(
          '[SupplyTariffs] DEBUG entries:',
          debugEntries.map(e => ({
            date: e.date,
            boxTypeId: e.boxTypeId,
            boxTypeName: e.boxTypeName,
            delivery: e.delivery,
            storage: e.storage,
          }))
        )
      }

      return response.coefficients || []
    },
    staleTime: 60 * 60 * 1000, // 1 hour cache
    gcTime: 2 * 60 * 60 * 1000, // 2 hours garbage collection
    refetchOnWindowFocus: false,
    retry: 2,
  })

  const coefficients = useMemo(() => query.data ?? [], [query.data])

  // Extract unique warehouses from SUPPLY coefficients
  const warehouses = useMemo(
    (): SupplyWarehouse[] => extractSupplyWarehouses(coefficients),
    [coefficients]
  )

  /** Find tariffs for specific warehouse ID and date */
  const findTariffsForDate = useCallback(
    (warehouseId: number, date: string): SupplyDateTariffs | null => {
      console.info('[findTariffsForDate] Searching:', {
        warehouseId,
        date,
        coefficientsCount: coefficients.length,
      })

      const result = findTariffsForDateFromCoefficients(coefficients, warehouseId, date)

      if (result) {
        console.info('[findTariffsForDate] Found match:', {
          warehouseId: result.warehouseId,
          date: result.date,
          boxTypeId: result.boxTypeId,
          deliveryBase: result.delivery.baseLiterRub,
          deliveryCoeff: result.delivery.coefficient,
        })
      } else {
        const normalizedDate = date.split('T')[0]
        console.warn(
          '[findTariffsForDate] No match found for warehouse',
          warehouseId,
          'date',
          normalizedDate
        )
        const uniqueIds = [...new Set(coefficients.map(c => c.warehouseId))].slice(0, 10)
        console.info('[findTariffsForDate] Available warehouseIds (first 10):', uniqueIds)
      }

      return result
    },
    [coefficients]
  )

  /** Find tariffs by warehouse name and date (fuzzy match) */
  const findTariffsByNameAndDate = useCallback(
    (warehouseName: string, date: string): SupplyDateTariffs | null =>
      findTariffsByNameFromCoefficients(coefficients, warehouseName, date),
    [coefficients]
  )

  /** Get tariffs for all available box types for a warehouse */
  const getTariffsByBoxType = useCallback(
    (warehouseId: number) => getTariffsByBoxTypeFromCoefficients(coefficients, warehouseId),
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
