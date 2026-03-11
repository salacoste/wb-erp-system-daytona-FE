/**
 * useWarehouses Hook
 * Story 44.12-FE: Warehouse Selection Dropdown
 * Epic 44: Price Calculator UI (Frontend)
 *
 * TanStack Query hook for fetching warehouses with tariffs.
 * Uses /v1/tariffs/warehouses-with-tariffs which returns:
 * - Warehouse names and IDs
 * - FBO/FBS delivery tariffs (base rate ~46₽, per-liter ~5-14₽)
 * - Storage tariffs (base rate ~0.07₽/day)
 * - Logistics and storage coefficients
 *
 * NOTE: Previously used /v1/tariffs/acceptance/coefficients/all which returned
 * incorrect premium rates from OrdersFBW API. Switched to correct endpoint
 * per backend team analysis.
 *
 * Cache TTL: 1 hour (tariffs can change daily)
 */

import { useQuery } from '@tanstack/react-query'
import { getWarehousesWithTariffs } from '@/lib/api/tariffs'
import type { Warehouse } from '@/types/warehouse'
import type { WarehouseWithTariffs } from '@/types/warehouse'

/** Query keys for warehouse-related queries */
export const warehousesQueryKeys = {
  all: ['warehouses'] as const,
  list: () => [...warehousesQueryKeys.all, 'list'] as const,
}

/**
 * Default tariff values (fallback when API returns null/undefined)
 * Based on WB official documentation
 */
const TARIFF_DEFAULTS = {
  deliveryBaseLiterRub: 46,
  deliveryPerLiterRub: 14,
  storageBaseLiterRub: 0.07,
  storagePerLiterRub: 0.05,
  logisticsCoefficient: 1.0,
  storageCoefficient: 1.0,
}

/**
 * Transform WarehouseWithTariffs to Warehouse format
 * Maps the correct API response structure to frontend Warehouse type
 */
function transformToWarehouse(w: WarehouseWithTariffs): Warehouse {
  // Use FBO tariffs for Price Calculator (FBO = товар на складе WB)
  const fboTariffs = w.tariffs?.fbo
  const storageTariffs = w.tariffs?.storage

  return {
    id: w.id,
    name: w.name,
    tariffs: {
      // Delivery tariffs from FBO (correct rates ~46₽ base, ~5-14₽ per liter)
      // Use || to fallback when API returns 0 (which is falsy but not null/undefined)
      deliveryBaseLiterRub: fboTariffs?.delivery_base_rub || TARIFF_DEFAULTS.deliveryBaseLiterRub,
      deliveryPerLiterRub: fboTariffs?.delivery_liter_rub || TARIFF_DEFAULTS.deliveryPerLiterRub,
      logisticsCoefficient: fboTariffs?.logistics_coefficient || TARIFF_DEFAULTS.logisticsCoefficient,
      // Storage tariffs (correct rates ~0.07₽/day base)
      // IMPORTANT: Use || instead of ?? because API may return 0 for missing storage data
      storageBaseLiterRub: storageTariffs?.base_per_day_rub || TARIFF_DEFAULTS.storageBaseLiterRub,
      storagePerLiterRub: storageTariffs?.liter_per_day_rub || TARIFF_DEFAULTS.storagePerLiterRub,
      storageCoefficient: storageTariffs?.coefficient || TARIFF_DEFAULTS.storageCoefficient,
    },
  }
}

/**
 * Fetch warehouses from warehouses-with-tariffs endpoint
 * Returns warehouses with correct FBO tariffs for Price Calculator
 */
async function fetchWarehouses(): Promise<Warehouse[]> {
  const response = await getWarehousesWithTariffs()
  const warehouseList = response.warehouses || []

  const warehouses = warehouseList
    .map(transformToWarehouse)
    .filter((w) => w.id > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))

  console.info('[Warehouses] Loaded', warehouses.length, 'warehouses with tariffs')

  return warehouses
}

/**
 * Hook to fetch warehouses with correct tariffs for Price Calculator
 *
 * Features:
 * - 1-hour cache (tariffs can change daily)
 * - Correct FBO tariffs (~46₽ base delivery rate)
 * - Storage tariffs (~0.07₽/day base rate)
 * - Sorted alphabetically (Russian locale)
 *
 * @returns TanStack Query result with warehouses including tariffs and coefficients
 */
export function useWarehouses() {
  return useQuery({
    queryKey: warehousesQueryKeys.list(),
    queryFn: fetchWarehouses,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours garbage collection
    refetchOnWindowFocus: false, // Stable data, no need to refetch
    retry: 2, // Retry twice on failure
  })
}
