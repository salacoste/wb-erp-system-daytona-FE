/**
 * Price Recommendations empty-shape fixture.
 * Story-1 fixture seeding for new domains per CLAUDE.md Multi-Source Orchestration.
 */

import type {
  PriceRecommendation,
  PriceRecommendationsResponse,
} from '@/types/price-recommendations'

/** Factory for a single price recommendation with all-safe defaults. */
export function emptyPriceRecommendation(
  overrides?: Partial<PriceRecommendation>
): PriceRecommendation {
  return {
    id: '',
    nmId: 0,
    vendorCode: null,
    productName: null,
    lastPrice: null,
    breakEvenPrice: 0,
    recommendedPrice: 0,
    marginAtCurrentPct: null,
    marginAtRecommendedPct: 0,
    gap: null,
    gapPct: null,
    targetMarginPct: 0,
    computedAt: '',
    priceBasis: 'SELLER',
    validationFlags: [],
    alternativeBasisPrice: null,
    ...overrides,
  }
}

/** Factory for a full PriceRecommendationsResponse with empty items. */
export function emptyPriceRecommendationsResponse(
  overrides?: Partial<PriceRecommendationsResponse>
): PriceRecommendationsResponse {
  return {
    items: [],
    total: 0,
    nextCursor: null,
    ...overrides,
  }
}
