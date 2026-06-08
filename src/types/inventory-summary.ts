/**
 * Inventory Summary Types
 * GET /v1/inventory/summary — stock snapshot with capitalization
 *
 * @see src/components/custom/dashboard/__tests__/epic65/mocks/api-mocks.ts
 * @see ../test-api/99-analytics-inventory.http
 */

/** Warehouse-level stock breakdown */
export interface WarehouseBreakdown {
  name: string
  count: number
}

/** Frontend-canonical shape for GET /v1/inventory/summary */
export interface InventorySummaryResponse {
  totalStock: number
  onWarehouse: number
  inWayToClient: number
  inWayFromClient: number
  capitalizationByCogs: number | null
  capitalizationByRetail: number
  cogsCoveragePct: number
  uniqueSkus: number
  warehouseBreakdown: WarehouseBreakdown[]
  snapshotDate: string
  snapshotSyncedAt: string
}
