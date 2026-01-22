/**
 * Warehouse Utility Functions
 * Story 44.12-FE: Warehouse Selection Dropdown
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Tariff parsing and warehouse filtering utilities
 */

import type { RawWarehouse, Warehouse } from '@/types/warehouse'

/**
 * Parse WB tariff expression to numeric value
 * WB returns tariffs as strings like "48*1" or "5*x"
 *
 * @example
 * parseTariffExpression("48*1") // => 48
 * parseTariffExpression("5*x")  // => 5
 * parseTariffExpression("0*1")  // => 0
 *
 * @param expr - Tariff expression string from WB API
 * @returns Numeric tariff value in RUB
 */
export function parseTariffExpression(expr: string): number {
  if (!expr || typeof expr !== 'string') return 0
  const match = expr.match(/^(\d+(?:\.\d+)?)\*/)
  return match ? parseFloat(match[1]) : 0
}

/**
 * Parse raw warehouse to structured warehouse with numeric tariffs
 * Handles both WB API format (warehouseID/warehouseName) and
 * backend format (id/name) for compatibility
 *
 * @param raw - Raw warehouse from WB API or backend
 * @returns Parsed warehouse with numeric tariff values
 */
export function parseWarehouse(raw: RawWarehouse): Warehouse {
  // Handle both WB API format and backend format
  const warehouseRaw = raw as RawWarehouse & { id?: number; name?: string }
  const id = raw.warehouseID ?? warehouseRaw.id ?? 0
  const name = raw.warehouseName ?? warehouseRaw.name ?? 'Unknown'

  return {
    id,
    name,
    tariffs: {
      deliveryBaseLiterRub: parseTariffExpression(raw.boxDeliveryBase),
      deliveryPerLiterRub: parseTariffExpression(raw.boxDeliveryLiter),
      storageBaseLiterRub: parseTariffExpression(raw.boxStorageBase),
      storagePerLiterRub: parseTariffExpression(raw.boxStorageLiter),
    },
  }
}

/**
 * Parse array of raw warehouses to structured warehouses
 * Filters out any entries that result in invalid warehouses (id=0)
 *
 * @param raw - Array of raw warehouses from WB API
 * @returns Array of parsed warehouses (valid entries only)
 */
export function parseWarehouses(raw: RawWarehouse[]): Warehouse[] {
  return raw.map(parseWarehouse).filter((w) => w.id > 0)
}

/**
 * Filter warehouses by search query
 * Searches by name (case-insensitive) and ID
 *
 * @param warehouses - Array of parsed warehouses
 * @param query - Search query string
 * @returns Filtered array of warehouses (excludes invalid entries)
 */
export function filterWarehouses(
  warehouses: Warehouse[],
  query: string,
): Warehouse[] {
  // Filter out invalid warehouses first (safety check)
  const validWarehouses = warehouses.filter(
    (w) => w && typeof w.id === 'number' && w.id > 0,
  )
  if (!query.trim()) return validWarehouses
  const lowerQuery = query.toLowerCase().trim()
  return validWarehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(lowerQuery) ||
      w.id.toString().includes(query.trim()),
  )
}

/**
 * Check if warehouse is in popular list
 *
 * @param warehouseId - Warehouse ID to check
 * @returns True if warehouse is popular
 */
export function isPopularWarehouse(warehouseId: number): boolean {
  const POPULAR_IDS: readonly number[] = [507, 117501, 117986, 208699, 218123]
  return POPULAR_IDS.includes(warehouseId)
}

/**
 * Separate warehouses into popular and other groups
 *
 * @param warehouses - Array of parsed warehouses
 * @returns Object with popular and other arrays
 */
export function separateWarehouses(warehouses: Warehouse[]): {
  popular: Warehouse[]
  other: Warehouse[]
} {
  const popular: Warehouse[] = []
  const other: Warehouse[] = []

  for (const warehouse of warehouses) {
    if (isPopularWarehouse(warehouse.id)) {
      popular.push(warehouse)
    } else {
      other.push(warehouse)
    }
  }

  return { popular, other }
}
