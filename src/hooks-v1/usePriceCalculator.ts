/**
 * Price Calculator React Query Hooks
 * Story 44.1-FE: TypeScript Types & API Client
 * Epic 44: Price Calculator UI (Frontend)
 * Reference: docs/request-backend/95-epic-43-price-calculator-api.md
 */

import { useMutation } from '@tanstack/react-query'
import { calculatePrice } from '@/lib/api/price-calculator'
import { ApiError } from '@/types/api'
import type {
  PriceCalculatorRequest,
  PriceCalculatorResponse,
} from '@/types/price-calculator'

/**
 * Generates a stable key for price calculator queries
 * Uses only essential fields for cache stability
 */
function getStableKey(params: PriceCalculatorRequest): string {
  // Use only the essential fields that affect the calculation result
  // This prevents cache misses when object references change but values are the same
  return JSON.stringify({
    target: params.target_margin_pct,
    cogs: params.cogs_rub,
    logistics_forward: params.logistics_forward_rub,
    logistics_reverse: params.logistics_reverse_rub,
    buyback: params.buyback_pct,
    advertising: params.advertising_pct,
    storage: params.storage_rub,
    vat: params.vat_pct,
    acquiring: params.acquiring_pct,
    // Include overrides if present
    commission_override: params.commission_pct,
    nm_id_override: params.overrides?.nm_id,
  })
}

/**
 * Query keys for price calculator
 * Follows TanStack Query v5 patterns with factory functions
 */
export const priceCalculatorQueryKeys = {
  /** Base key for all price calculator queries */
  all: ['price-calculator'] as const,

  /** Key for price calculation mutations - uses stable key for cache consistency */
  calculate: (params: PriceCalculatorRequest) =>
    [...priceCalculatorQueryKeys.all, 'calculate', getStableKey(params)] as const,
}

/**
 * Hook to calculate price with target margin
 * Uses TanStack Query v5 mutation pattern (Epic 24 reference: useStorageAnalytics)
 *
 * @param options - Mutation callbacks (onSuccess, onError)
 * @returns Mutation object with mutate function and state
 *
 * @example
 * const { mutate, isPending, error, data } = usePriceCalculator({
 *   onSuccess: (result) => {
 *     console.log('Recommended price:', result.result.recommended_price);
 *   },
 *   onError: (error) => {
 *     if (error instanceof ApiError) {
 *       console.error('API Error:', error.status, error.message);
 *     }
 *   },
 * });
 *
 * mutate({ target_margin_pct: 20, cogs_rub: 1500, ... });
 */
export function usePriceCalculator(options?: {
  onSuccess?: (data: PriceCalculatorResponse) => void
  onError?: (error: ApiError) => void
  onSettled?: () => void
}) {
  return useMutation<PriceCalculatorResponse, ApiError, PriceCalculatorRequest>({
    mutationFn: calculatePrice,
    onSuccess: (data) => {
      console.info('[Price Calculator] Calculation successful:', {
        recommendedPrice: data.result.recommended_price,
        margin: data.result.actual_margin_pct,
        warnings: data.warnings,
      })
      options?.onSuccess?.(data)
    },
    onError: (error) => {
      console.error('[Price Calculator] Calculation failed:', error)
      options?.onError?.(error)
    },
    onSettled: () => {
      // Reset calculating state after mutation completes (success or error)
      options?.onSettled?.()
    },
  })
}
