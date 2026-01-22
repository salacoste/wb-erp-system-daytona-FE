/**
 * useWarehouses Hook
 * Story 44.12-FE: Warehouse Selection Dropdown
 * Epic 44: Price Calculator UI (Frontend)
 *
 * TanStack Query hook for fetching warehouses with REAL WB IDs.
 * Uses /v1/tariffs/acceptance/coefficients/all which returns:
 * - Real warehouse names (e.g., "Краснодар (Тихорецкая)")
 * - Real WB IDs (e.g., 130744) that work with acceptance API
 * - Embedded coefficients for logistics and storage
 *
 * Cache TTL: 1 hour (coefficients can change daily)
 */

import { useQuery } from '@tanstack/react-query'
import { getAllAcceptanceCoefficients } from '@/lib/api/tariffs'
import type { Warehouse } from '@/types/warehouse'
import type { AcceptanceCoefficient } from '@/types/tariffs'

/** Query keys for warehouse-related queries */
export const warehousesQueryKeys = {
  all: ['warehouses'] as const,
  list: () => [...warehousesQueryKeys.all, 'list'] as const,
}

/**
 * Transform acceptance coefficient to Warehouse format
 * Extracts unique warehouses with real IDs and embedded coefficients
 */
function transformToWarehouse(coeff: AcceptanceCoefficient): Warehouse {
  return {
    id: coeff.warehouseId,
    name: coeff.warehouseName,
    tariffs: {
      deliveryBaseLiterRub: coeff.delivery?.baseLiterRub ?? 46,
      deliveryPerLiterRub: coeff.delivery?.additionalLiterRub ?? 14,
      storageBaseLiterRub: coeff.storage?.baseLiterRub ?? 0.07,
      storagePerLiterRub: coeff.storage?.additionalLiterRub ?? 0.05,
      logisticsCoefficient: coeff.delivery?.coefficient ?? 1.0,
      storageCoefficient: coeff.storage?.coefficient ?? 1.0,
    },
  }
}

/**
 * Fetch warehouses from acceptance coefficients endpoint
 * Returns unique warehouses with real WB IDs
 */
async function fetchWarehouses(): Promise<Warehouse[]> {
  const response = await getAllAcceptanceCoefficients()
  const coefficients = response.coefficients || []

  // Get unique warehouses by ID (API returns multiple dates per warehouse)
  const warehouseMap = new Map<number, AcceptanceCoefficient>()
  for (const coeff of coefficients) {
    if (!warehouseMap.has(coeff.warehouseId)) {
      warehouseMap.set(coeff.warehouseId, coeff)
    }
  }

  const warehouses = Array.from(warehouseMap.values())
    .map(transformToWarehouse)
    .filter((w) => w.id > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))

  console.info('[Warehouses] Loaded', warehouses.length, 'unique warehouses with real IDs')

  return warehouses
}

/**
 * Hook to fetch warehouses with REAL WB IDs
 *
 * Features:
 * - 1-hour cache (coefficients can change daily)
 * - Real WB IDs that work with acceptance coefficients API
 * - Embedded coefficients from the same endpoint
 * - Sorted alphabetically (Russian locale)
 *
 * @returns TanStack Query result with warehouses including real IDs and coefficients
 */
export function useWarehouses() {
  return useQuery({
    queryKey: warehousesQueryKeys.list(),
    queryFn: fetchWarehouses,
    staleTime: 60 * 60 * 1000, // 1 hour - coefficients can change
    gcTime: 2 * 60 * 60 * 1000, // 2 hours garbage collection
    refetchOnWindowFocus: false, // Stable data, no need to refetch
    retry: 2, // Retry twice on failure
  })
}
