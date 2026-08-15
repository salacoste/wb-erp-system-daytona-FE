/**
 * Price Recommendations Types
 * Epic 121 Phase 1: Per-SKU price recommendation engine
 * Story 122.2-FE: price history types
 */

/** SPP-1: repricing price basis (BE enum PriceBasis; STOREFRONT_SESSION reserved — backend 400s). */
export type PriceBasis = 'SELLER' | 'STOREFRONT_ANON'

/**
 * SPP-1: basis value as the boundary may receive it — unknown/future enum
 * members (e.g. STOREFRONT_SESSION) map to 'UNKNOWN' (Defensive Frontend:
 * indicate, never silently relabel). UI renders a distinct neutral chip.
 */
export type PriceBasisOrUnknown = PriceBasis | 'UNKNOWN'

export interface PriceRecommendation {
  id: string
  nmId: number
  vendorCode: string | null
  productName: string | null
  lastPrice: number | null
  // AP#8: money/ratio fields are number|null — null renders '—' (never a fabricated "0,00 ₽").
  breakEvenPrice: number | null
  recommendedPrice: number | null
  marginAtCurrentPct: number | null
  marginAtRecommendedPct: number | null
  gap: number | null
  gapPct: number | null
  targetMarginPct: number
  computedAt: string
  /** SPP-1.4: price basis this row was computed under ('UNKNOWN' on unrecognized backend values). */
  priceBasis: PriceBasisOrUnknown
  /** SPP-1.4: validation flags — 'STOREFRONT_STALE' = storefront stale, seller fallback price used. */
  validationFlags: string[]
  /** SPP-1.6: seller-equivalent companion price under a storefront primary (null on batch rows). */
  alternativeBasisPrice: number | null
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
