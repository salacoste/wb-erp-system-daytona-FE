/**
 * Price Recommendations Types
 * Epic 121 Phase 1: Per-SKU price recommendation engine
 * Story 122.2-FE: price history types
 */

export interface PriceRecommendation {
  id: string
  nmId: number
  vendorCode: string | null
  productName: string | null
  lastPrice: number | null
  breakEvenPrice: number
  recommendedPrice: number
  marginAtCurrentPct: number | null
  marginAtRecommendedPct: number
  gap: number | null
  gapPct: number | null
  targetMarginPct: number
  computedAt: string
}

export interface PriceRecommendationsResponse {
  items: PriceRecommendation[]
  total: number
  nextCursor: string | null
}

export interface PriceRecommendationsParams {
  limit?: number
  target_margin_pct?: number
  gap_filter?: string
  sort?: string
  cursor?: string
}

/** Single weekly data point for price recommendation history (Story 122.2-FE). */
export interface PriceRecommendationHistoryPoint {
  weekStart: string
  lastPrice: number | null
  recommendedPrice: number | null
  breakEvenPrice: number | null
  marginAtCurrentPct: number | null
  marginAtRecPct: number | null
  gap: number | null
  gapPct: number | null
  targetMarginPct: number
  recomputationCount: number
}

export interface PriceRecommendationHistoryParams {
  limit?: number
}
