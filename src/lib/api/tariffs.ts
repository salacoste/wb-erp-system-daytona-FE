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

  const response = await apiClient.get<CommissionsResponse>(
    '/v1/tariffs/commissions',
  )

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

  const response = await apiClient.get<WarehousesResponse>(
    '/v1/tariffs/warehouses',
  )

  console.info('[Tariffs] Loaded', response.meta.total, 'warehouses')

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
  warehouseId: number,
): Promise<AcceptanceCoefficientsResponse> {
  console.info('[Tariffs] Fetching acceptance coefficients for warehouse', warehouseId)

  const response = await apiClient.get<AcceptanceCoefficientsResponse>(
    `/v1/tariffs/acceptance/coefficients?warehouseId=${warehouseId}`,
  )

  console.info('[Tariffs] Loaded', response.coefficients.length, 'coefficients', {
    available: response.meta.available,
    unavailable: response.meta.unavailable,
  })

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
