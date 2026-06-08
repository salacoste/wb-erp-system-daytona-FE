/**
 * Inventory Summary API Client + Normalizer
 * GET /v1/inventory/summary — stock snapshot with capitalization
 *
 * @see ../test-api/99-analytics-inventory.http
 */

import { apiClient } from '@/lib/api-client'
import { toCount, toNullableNumber, toStr, asRecord } from './normalizer-helpers'
import type { InventorySummaryResponse, WarehouseBreakdown } from '@/types/inventory-summary'

// ---------------------------------------------------------------------------
// Boundary Normalizer (snake_case backend → camelCase frontend)
// ---------------------------------------------------------------------------

function normalizeWarehouseBreakdown(raw: unknown): WarehouseBreakdown {
  const r = asRecord(raw)
  return {
    name: toStr(r.name),
    count: toCount(r.count),
  }
}

function normalizeInventorySummary(raw: unknown): InventorySummaryResponse {
  const r = asRecord(raw)
  const breakdown = Array.isArray(r.warehouse_breakdown)
    ? r.warehouse_breakdown.map(normalizeWarehouseBreakdown)
    : []

  return {
    totalStock: toCount(r.total_stock),
    onWarehouse: toCount(r.on_warehouse),
    inWayToClient: toCount(r.in_way_to_client),
    inWayFromClient: toCount(r.in_way_from_client),
    capitalizationByCogs: toNullableNumber(r.capitalization_by_cogs),
    capitalizationByRetail: toCount(r.capitalization_by_retail),
    cogsCoveragePct: toCount(r.cogs_coverage_pct),
    uniqueSkus: toCount(r.unique_skus),
    warehouseBreakdown: breakdown,
    snapshotDate: toStr(r.snapshot_date),
    snapshotSyncedAt: toStr(r.snapshot_synced_at),
  }
}

// ---------------------------------------------------------------------------
// API Function
// ---------------------------------------------------------------------------

/** GET /v1/inventory/summary */
export async function getInventorySummary(): Promise<InventorySummaryResponse> {
  const raw = await apiClient.get<unknown>('/v1/inventory/summary', { skipDataUnwrap: true })
  return normalizeInventorySummary(raw)
}

// ---------------------------------------------------------------------------
// Query Key Factory
// ---------------------------------------------------------------------------

export const inventorySummaryQueryKeys = {
  all: ['inventory-summary'] as const,
  summary: () => [...inventorySummaryQueryKeys.all, 'summary'] as const,
}
