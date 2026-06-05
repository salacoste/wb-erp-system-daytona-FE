/**
 * Tariffs API Client
 * Story 44.16-FE: Category Selection with Search
 * Epic 44: Price Calculator UI (Frontend)
 * Reference: PRICE-CALCULATOR-REQUIREMENTS.md Section 12
 *
 * Rate Limits:
 * - tariffs scope: 10 req/min (commissions, warehouses)
 * - orders_fbw scope: 6 req/min (acceptance coefficients)
 *
 * Box tariff helpers: see tariffs-box.ts
 */

import { apiClient } from '@/lib/api-client'
import { logger } from '@/lib/logger'
import type {
  CommissionsResponse,
  WarehousesResponse,
  AcceptanceCoefficientsResponse,
  TariffSettings,
} from '@/types/tariffs'
// Story 89.1-FE: Boundary normalizers absorb SDK version drift at the API boundary
import {
  normalizeCommissionsResponse,
  normalizeWarehousesResponse,
  normalizeAcceptanceCoefficientsResponse,
  normalizeTariffSettings,
} from './tariffs-normalizer'

// Barrel re-exports from extracted module (box tariff helpers)
export {
  getBoxTariffs,
  getWarehousesWithTariffs,
  type WarehousesWithTariffsResponse,
} from './tariffs-box'

// ============================================================================
// API Functions
// ============================================================================

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
  logger.debug('[Tariffs] Fetching category commissions')

  const raw = await apiClient.get<unknown>('/v1/tariffs/commissions')
  const response = normalizeCommissionsResponse(raw)

  logger.debug('[Tariffs] Loaded', response.meta.total, 'categories', {
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
  logger.debug('[Tariffs] Fetching warehouses')

  const raw = await apiClient.get<unknown>('/v1/tariffs/warehouses')
  const response = normalizeWarehousesResponse(raw)

  logger.debug('[Tariffs] Loaded', response.warehouses.length, 'warehouses')

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
  logger.debug('[Tariffs] Fetching acceptance coefficients for warehouse', warehouseId)

  const raw = await apiClient.get<unknown>(
    `/v1/tariffs/acceptance/coefficients?warehouseId=${warehouseId}`
  )
  const response = normalizeAcceptanceCoefficientsResponse(raw)

  logger.debug('[Tariffs] Loaded', response.coefficients.length, 'coefficients', {
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
  logger.debug('[Tariffs] Fetching ALL acceptance coefficients')

  const raw = await apiClient.get<unknown>('/v1/tariffs/acceptance/coefficients/all')
  const response = normalizeAcceptanceCoefficientsResponse(raw)

  logger.debug(
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
  logger.debug('[Tariffs] Fetching tariff settings')

  const raw = await apiClient.get<unknown>('/v1/tariffs/settings')
  const response = normalizeTariffSettings(raw)

  logger.debug('[Tariffs] Loaded tariff settings', {
    fboCommission: response.default_commission_fbo_pct,
    fbsCommission: response.default_commission_fbs_pct,
    effectiveFrom: response.effective_from,
  })

  return response
}
