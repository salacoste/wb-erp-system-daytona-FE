/**
 * Price Calculator API Client
 * Story 44.1-FE: TypeScript Types & API Client
 * Epic 44: Price Calculator UI (Frontend)
 * Reference: docs/request-backend/95-epic-43-price-calculator-api.md
 */

import { apiClient } from '@/lib/api-client'
import type {
  PriceCalculatorRequest,
  PriceCalculatorResponse,
} from '@/types/price-calculator'

/**
 * Calculate optimal selling price based on target margin
 * POST /v1/products/price-calculator
 *
 * Uses centralized apiClient which automatically adds:
 * - Authorization: Bearer {token} from auth store
 * - X-Cabinet-Id: {cabinetId} from auth store
 *
 * @param request - Price calculation parameters
 * @returns Calculated price with cost breakdown
 *
 * @example
 * const result = await calculatePrice({
 *   target_margin_pct: 20.0,
 *   cogs_rub: 1500.0,
 *   logistics_forward_rub: 200.0,
 *   logistics_reverse_rub: 150.0,
 *   buyback_pct: 98.0,
 *   advertising_pct: 5.0,
 *   storage_rub: 50.0,
 * });
 * // => { result: { recommended_price: 2500, actual_margin_pct: 20.5, ... }, ... }
 */
export async function calculatePrice(
  request: PriceCalculatorRequest,
): Promise<PriceCalculatorResponse> {
  console.info('[Price Calculator] Calculating price:', {
    targetMargin: request.target_margin_pct,
    cogs: request.cogs_rub,
    logistics: request.logistics_forward_rub + request.logistics_reverse_rub,
  })

  const response = await apiClient.post<PriceCalculatorResponse>(
    '/v1/products/price-calculator',
    request,
  )

  console.info('[Price Calculator] Calculation result:', {
    recommendedPrice: response.result.recommended_price,
    actualMargin: response.result.actual_margin_pct,
    warnings: response.warnings.length,
  })

  return response
}
