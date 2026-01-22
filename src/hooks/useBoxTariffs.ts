/**
 * useBoxTariffs Hook
 * Story 44.13-FE: Auto-fill Coefficients from Warehouse
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Fetches box tariffs with logistics/storage coefficients.
 * Used as fallback when acceptance coefficients API fails for synthetic warehouse IDs.
 */

import { useQuery } from '@tanstack/react-query'
import { getBoxTariffs } from '@/lib/api/tariffs'
import type { BoxTariffItem } from '@/types/warehouse'

/** Query keys for box tariffs queries */
export const boxTariffsQueryKeys = {
  all: ['boxTariffs'] as const,
  byDate: (date?: string) => [...boxTariffsQueryKeys.all, date || 'today'] as const,
}

/**
 * Normalized box tariff with warehouse name lookup
 */
export interface BoxTariffLookup {
  /** Map of normalized warehouse name to tariff data */
  byName: Map<string, BoxTariffItem>
  /** Get tariff by warehouse name (case-insensitive) */
  getTariff: (warehouseName: string) => BoxTariffItem | undefined
}

/**
 * Normalize warehouse name for lookup (lowercase, trimmed)
 */
function normalizeWarehouseName(name: string): string {
  return name.toLowerCase().trim()
}

/**
 * Transform box tariffs to lookup structure
 */
function createTariffLookup(tariffs: BoxTariffItem[]): BoxTariffLookup {
  const byName = new Map<string, BoxTariffItem>()

  for (const tariff of tariffs) {
    const normalizedName = normalizeWarehouseName(tariff.warehouseName)
    byName.set(normalizedName, tariff)
  }

  return {
    byName,
    getTariff: (name: string) => byName.get(normalizeWarehouseName(name)),
  }
}

/**
 * Hook to fetch box tariffs for coefficient lookup by warehouse name
 *
 * Features:
 * - 1-hour cache (coefficients can change daily)
 * - Case-insensitive warehouse name lookup
 * - Used as fallback for synthetic warehouse IDs
 *
 * @param date - Optional date for tariffs (defaults to today)
 * @returns TanStack Query result with tariff lookup
 */
export function useBoxTariffs(date?: string) {
  return useQuery({
    queryKey: boxTariffsQueryKeys.byDate(date),
    queryFn: async (): Promise<BoxTariffLookup> => {
      const response = await getBoxTariffs(date)
      return createTariffLookup(response.tariffs || [])
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours garbage collection
    refetchOnWindowFocus: false,
    retry: 2,
  })
}
