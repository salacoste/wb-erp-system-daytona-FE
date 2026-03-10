/**
 * Tariffs Box & Warehouse API Client
 * Extracted from tariffs.ts for file size compliance (Epic 74)
 *
 * Box tariff helpers and warehouse-with-tariffs endpoint.
 */

import { apiClient } from '@/lib/api-client'
import type { BoxTariffsResponse, BoxTariffItem, WarehouseWithTariffs } from '@/types/warehouse'

// ============================================================================
// Types
// ============================================================================

/**
 * Response from GET /v1/tariffs/warehouses-with-tariffs
 */
export interface WarehousesWithTariffsResponse {
  warehouses: WarehouseWithTariffs[]
  updated_at?: string
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch box tariffs with logistics/storage coefficients by warehouse name
 * Uses GET /v1/tariffs/warehouses-with-tariffs and transforms response
 *
 * Used as fallback when acceptance coefficients API fails (e.g., synthetic warehouse IDs).
 * Contains coefficients matched by warehouse name.
 * Cached for 1 hour.
 * Rate Limit: 10 req/min (tariffs scope)
 *
 * @param date - Optional date in YYYY-MM-DD format (defaults to today)
 * @returns Box tariffs with coefficients for all warehouses
 */
export async function getBoxTariffs(date?: string): Promise<BoxTariffsResponse> {
  const params = date ? `?date=${date}` : ''
  console.info('[Tariffs] Fetching box tariffs', { date: date || 'today' })

  // Use warehouses-with-tariffs endpoint and transform to BoxTariffsResponse
  const response = await apiClient.get<WarehousesWithTariffsResponse>(
    `/v1/tariffs/warehouses-with-tariffs${params}`
  )

  // Transform WarehouseWithTariffs[] to BoxTariffItem[]
  const tariffs: BoxTariffItem[] = (response.warehouses || []).map(w => ({
    warehouseName: w.name,
    geoName: w.federal_district || undefined,
    logistics: {
      coefficient: w.tariffs?.fbo?.logistics_coefficient ?? 1.0,
      baseLiterRub: w.tariffs?.fbo?.delivery_base_rub ?? 0,
      additionalLiterRub: w.tariffs?.fbo?.delivery_liter_rub ?? 0,
    },
    storage: {
      // IMPORTANT: Use || instead of ?? because API may return 0 for missing storage data
      coefficient: w.tariffs?.storage?.coefficient || 1.0,
      baseLiterRub: w.tariffs?.storage?.base_per_day_rub || 0,
      additionalLiterRub: w.tariffs?.storage?.liter_per_day_rub || 0,
    },
  }))

  console.info('[Tariffs] Loaded', tariffs.length, 'box tariffs')

  return {
    tariffs,
    meta: {
      date: date || new Date().toISOString().split('T')[0],
      cached: true,
      cache_ttl_seconds: 3600,
    },
  }
}

/**
 * Fetch warehouses with embedded tariffs and coefficients
 * GET /v1/tariffs/warehouses-with-tariffs
 *
 * Returns warehouses with logistics and storage coefficients embedded.
 * Preferred over /v1/tariffs/warehouses for Price Calculator.
 * Cached for 1 hour.
 *
 * @returns Warehouses with coefficients
 */
export async function getWarehousesWithTariffs(
  date?: string
): Promise<WarehousesWithTariffsResponse> {
  // Backend requires date param (forwarded to WB API tariffs/box)
  const effectiveDate = date || new Date().toISOString().split('T')[0]
  console.info('[Tariffs] Fetching warehouses with tariffs', { date: effectiveDate })

  const response = await apiClient.get<WarehousesWithTariffsResponse>(
    `/v1/tariffs/warehouses-with-tariffs?date=${effectiveDate}`
  )

  console.info('[Tariffs] Loaded', response.warehouses?.length || 0, 'warehouses with tariffs')

  return response
}
