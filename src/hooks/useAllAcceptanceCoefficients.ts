/**
 * useAllAcceptanceCoefficients Hook
 * Fetches ALL acceptance coefficients from /v1/tariffs/acceptance/coefficients/all
 *
 * Used to resolve warehouse ID mismatch between:
 * - /v1/tariffs/warehouses-with-tariffs (tariff DB IDs)
 * - /v1/tariffs/acceptance/coefficients (OrdersFBW API IDs)
 *
 * Strategy: Fetch all warehouses with coefficients, match by warehouse name
 */

import { useQuery } from '@tanstack/react-query'
import { getAllAcceptanceCoefficients } from '@/lib/api/tariffs'
import type { AcceptanceCoefficient } from '@/types/tariffs'

/** Query keys for all coefficients */
export const allCoefficientsQueryKeys = {
  all: ['coefficients', 'all'] as const,
}

/** Warehouse with its coefficients from /all endpoint */
export interface WarehouseCoefficientsData {
  warehouseId: number
  warehouseName: string
  coefficients: AcceptanceCoefficient[]
}

/** Grouped coefficients by warehouse name */
export interface GroupedCoefficients {
  /** Map of warehouse name -> warehouse data with coefficients */
  byName: Map<string, WarehouseCoefficientsData>
  /** Map of warehouse ID (from tariffs) -> warehouse data */
  byId: Map<number, WarehouseCoefficientsData>
}

/**
 * Group coefficients by warehouse name
 * Creates efficient lookup maps for matching warehouses
 */
function groupCoefficients(coefficients: AcceptanceCoefficient[]): GroupedCoefficients {
  const byName = new Map<string, WarehouseCoefficientsData>()
  const byId = new Map<number, WarehouseCoefficientsData>()

  for (const coeff of coefficients) {
    const name = coeff.warehouseName
    const id = coeff.warehouseId

    // Group by warehouse name
    if (!byName.has(name)) {
      byName.set(name, {
        warehouseId: id,
        warehouseName: name,
        coefficients: [],
      })
    }
    byName.get(name)!.coefficients.push(coeff)

    // Also index by ID
    if (!byId.has(id)) {
      byId.set(id, byName.get(name)!)
    }
  }

  return { byName, byId }
}

/**
 * Hook to fetch ALL acceptance coefficients for all warehouses
 *
 * Features:
 * - 1-hour cache (coefficients can change daily)
 * - Groups coefficients by warehouse name for easy lookup
 * - Used to resolve warehouse ID mismatch
 *
 * @returns Query result with grouped coefficients
 */
export function useAllAcceptanceCoefficients() {
  return useQuery({
    queryKey: allCoefficientsQueryKeys.all,
    queryFn: async () => {
      const response = await getAllAcceptanceCoefficients()
      const coefficients = response.coefficients || []
      console.info('[AllCoefficients] Fetched from /all:', coefficients.length, 'coefficient entries')
      if (coefficients.length > 0) {
        const uniqueNames = new Set(coefficients.map(c => c.warehouseName))
        console.info('[AllCoefficients] Unique warehouse names:', uniqueNames.size, Array.from(uniqueNames).slice(0, 10))
      }
      return groupCoefficients(coefficients)
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours garbage collection
    refetchOnWindowFocus: false,
    retry: 2,
  })
}

/**
 * Normalize warehouse name for fuzzy matching
 * Removes extra spaces and converts to lowercase
 */
function normalizeWarehouseName(name: string): string {
  return name.trim().toLowerCase()
}

/**
 * Find coefficients for a warehouse by name with fuzzy matching
 *
 * Matching strategy (in order):
 * 1. Exact match (case-insensitive)
 * 2. OrdersFBW name starts with tariff DB name (e.g., "Владимир" → "Владимир Воршинское")
 * 3. Tariff DB name contains in OrdersFBW name
 *
 * @param grouped - Grouped coefficients from useAllAcceptanceCoefficients
 * @param warehouseName - Warehouse name to find (from tariff DB)
 * @returns Coefficients for the warehouse or null if not found
 */
export function findCoefficientsByName(
  grouped: GroupedCoefficients | undefined,
  warehouseName: string | undefined,
): WarehouseCoefficientsData | null {
  if (!grouped || !warehouseName) return null

  const searchName = normalizeWarehouseName(warehouseName)

  // Strategy 1: Exact match (case-insensitive)
  for (const [name, data] of grouped.byName) {
    if (normalizeWarehouseName(name) === searchName) {
      return data
    }
  }

  // Strategy 2: OrdersFBW name starts with tariff DB name
  // e.g., "Владимир" matches "Владимир Воршинское"
  for (const [name, data] of grouped.byName) {
    if (normalizeWarehouseName(name).startsWith(searchName)) {
      console.info('[Coefficients] Fuzzy match (startsWith):', warehouseName, '→', name)
      return data
    }
  }

  // Strategy 3: Tariff DB name contained in OrdersFBW name
  // Fallback for cases like "СЦ Коледино" matching "Коледино"
  for (const [name, data] of grouped.byName) {
    if (normalizeWarehouseName(name).includes(searchName)) {
      console.info('[Coefficients] Fuzzy match (includes):', warehouseName, '→', name)
      return data
    }
  }

  return null
}

/**
 * Find coefficients for a warehouse by ID
 * Note: This uses the ID from the /all endpoint, not the tariff DB ID
 *
 * @param grouped - Grouped coefficients from useAllAcceptanceCoefficients
 * @param warehouseId - Warehouse ID from /all endpoint
 * @returns Coefficients for the warehouse or null if not found
 */
export function findCoefficientsById(
  grouped: GroupedCoefficients | undefined,
  warehouseId: number | undefined,
): WarehouseCoefficientsData | null {
  if (!grouped || !warehouseId) return null
  return grouped.byId.get(warehouseId) ?? null
}
