/**
 * Tariffs Box & Warehouse API Client
 * Extracted from tariffs.ts for file size compliance (Epic 74)
 *
 * Box tariff helpers and warehouse-with-tariffs endpoint.
 */

import { apiClient } from '@/lib/api-client'
import { logger } from '@/lib/logger'
import {
  normalizeBoxTariffsResponse,
  normalizeWarehousesWithTariffsResponse,
} from './tariffs-box-normalizer'
import type { WarehousesWithTariffsResponse } from './tariffs-box-normalizer'

// Re-export the type for consumers
export type { WarehousesWithTariffsResponse }

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
export async function getBoxTariffs(date?: string) {
  const params = date ? `?date=${date}` : ''
  logger.debug('[Tariffs] Fetching box tariffs', { date: date || 'today' })

  const raw = await apiClient.get<unknown>(`/v1/tariffs/warehouses-with-tariffs${params}`)

  const result = normalizeBoxTariffsResponse(raw, date)
  logger.debug('[Tariffs] Loaded', result.tariffs.length, 'box tariffs')

  return result
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
  logger.debug('[Tariffs] Fetching warehouses with tariffs', { date: effectiveDate })

  const raw = await apiClient.get<unknown>(
    `/v1/tariffs/warehouses-with-tariffs?date=${effectiveDate}`
  )

  const response = normalizeWarehousesWithTariffsResponse(raw)
  logger.debug('[Tariffs] Loaded', response.warehouses?.length || 0, 'warehouses with tariffs')

  return response
}
