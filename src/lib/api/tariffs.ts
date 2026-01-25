/**
 * Tariffs API Client
 * Story 44.16-FE: Category Selection with Search
 * Epic 44: Price Calculator UI (Frontend)
 * Reference: PRICE-CALCULATOR-REQUIREMENTS.md Section 12
 *
 * Rate Limits:
 * - tariffs scope: 10 req/min (commissions, warehouses)
 * - orders_fbw scope: 6 req/min (acceptance coefficients)
 */

import { apiClient } from '@/lib/api-client'
import type {
  CommissionsResponse,
  WarehousesResponse,
  AcceptanceCoefficientsResponse,
  TariffSettings,
} from '@/types/tariffs'
import type { BoxTariffsResponse, BoxTariffItem, WarehouseWithTariffs } from '@/types/warehouse'

/**
 * Fetch all category commissions (7346 categories)
 * GET /v1/tariffs/commissions
 *
 * Response: ~50KB, cached for 24 hours
 * Rate Limit: 10 req/min (tariffs scope)
 *
 * @returns Array of category commissions with metadata
 *
 * @example
 * const response = await getCommissions()
 * // => { commissions: [...], meta: { total: 7346, cached: true } }
 */
export async function getCommissions(): Promise<CommissionsResponse> {
  console.info('[Tariffs] Fetching category commissions')

  const response = await apiClient.get<CommissionsResponse>('/v1/tariffs/commissions')

  console.info('[Tariffs] Loaded', response.meta.total, 'categories', {
    cached: response.meta.cached,
  })

  return response
}

/**
 * Fetch all warehouses
 * GET /v1/tariffs/warehouses
 *
 * Response: ~5KB (~50 warehouses), cached for 24 hours
 * Rate Limit: 10 req/min (tariffs scope)
 *
 * @returns Array of warehouses with metadata
 */
export async function getWarehouses(): Promise<WarehousesResponse> {
  console.info('[Tariffs] Fetching warehouses')

  const response = await apiClient.get<WarehousesResponse>('/v1/tariffs/warehouses')

  console.info('[Tariffs] Loaded', response.warehouses.length, 'warehouses')

  return response
}

/**
 * Fetch acceptance coefficients for a specific warehouse
 * GET /v1/tariffs/acceptance/coefficients
 *
 * Returns 14 days of coefficients for the specified warehouse.
 * Cached for 1 hour.
 * Rate Limit: 6 req/min (orders_fbw scope - STRICTER!)
 *
 * @param warehouseId - Warehouse ID to fetch coefficients for
 * @returns Acceptance coefficients with delivery/storage data
 */
export async function getAcceptanceCoefficients(
  warehouseId: number
): Promise<AcceptanceCoefficientsResponse> {
  console.info('[Tariffs] Fetching acceptance coefficients for warehouse', warehouseId)

  const response = await apiClient.get<AcceptanceCoefficientsResponse>(
    `/v1/tariffs/acceptance/coefficients?warehouseId=${warehouseId}`
  )

  console.info('[Tariffs] Loaded', response.coefficients.length, 'coefficients', {
    available: response.meta.available,
    unavailable: response.meta.unavailable,
  })

  return response
}

/**
 * Fetch ALL acceptance coefficients for ALL warehouses
 * GET /v1/tariffs/acceptance/coefficients/all
 *
 * Returns coefficients for all 140+ warehouses with REAL WB IDs and names.
 * Use this for warehouse dropdown - these IDs work with acceptance API.
 * Cached for 1 hour.
 *
 * @returns All acceptance coefficients with real warehouse IDs
 */
export async function getAllAcceptanceCoefficients(): Promise<AcceptanceCoefficientsResponse> {
  console.info('[Tariffs] Fetching ALL acceptance coefficients')

  const response = await apiClient.get<AcceptanceCoefficientsResponse>(
    '/v1/tariffs/acceptance/coefficients/all'
  )

  console.info(
    '[Tariffs] Loaded',
    response.coefficients?.length || 0,
    'coefficients for all warehouses'
  )

  return response
}

/**
 * Fetch global tariff settings
 * GET /v1/tariffs/settings
 *
 * Fallback values from local DB, no WB API rate limit.
 * Cached for 24 hours.
 *
 * @returns Global tariff settings with volume tiers and rates
 */
export async function getTariffSettings(): Promise<TariffSettings> {
  console.info('[Tariffs] Fetching tariff settings')

  const response = await apiClient.get<TariffSettings>('/v1/tariffs/settings')

  console.info('[Tariffs] Loaded tariff settings', {
    fboCommission: response.default_commission_fbo_pct,
    fbsCommission: response.default_commission_fbs_pct,
    effectiveFrom: response.effective_from,
  })

  return response
}

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
 * Response from GET /v1/tariffs/warehouses-with-tariffs
 */
export interface WarehousesWithTariffsResponse {
  warehouses: WarehouseWithTariffs[]
  updated_at?: string
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
export async function getWarehousesWithTariffs(): Promise<WarehousesWithTariffsResponse> {
  console.info('[Tariffs] Fetching warehouses with tariffs')

  const response = await apiClient.get<WarehousesWithTariffsResponse>(
    '/v1/tariffs/warehouses-with-tariffs'
  )

  console.info('[Tariffs] Loaded', response.warehouses?.length || 0, 'warehouses with tariffs')

  return response
}
