/**
 * Price Recommendations Boundary Normalizer
 * Coerces raw backend responses into frontend-canonical shapes.
 * Uses shared helpers from normalizer-helpers.ts.
 */

import { toCount, toNullableNumber, toStringOrNull, toStr, asRecord } from './normalizer-helpers'
import type {
  PriceRecommendation,
  PriceRecommendationsResponse,
} from '@/types/price-recommendations'

function toItem(raw: unknown): PriceRecommendation {
  const r = asRecord(raw)
  return {
    id: toStr(r.id),
    nmId: toCount(r.nmId),
    vendorCode: toStringOrNull(r.vendorCode),
    productName: toStringOrNull(r.productName),
    lastPrice: toNullableNumber(r.lastPrice),
    breakEvenPrice: toNullableNumber(r.breakEvenPrice) ?? 0,
    recommendedPrice: toNullableNumber(r.recommendedPrice) ?? 0,
    marginAtCurrentPct: toNullableNumber(r.marginAtCurrentPct),
    marginAtRecommendedPct: toNullableNumber(r.marginAtRecommendedPct) ?? 0,
    gap: toNullableNumber(r.gap),
    gapPct: toNullableNumber(r.gapPct),
    targetMarginPct: toNullableNumber(r.targetMarginPct) ?? 0,
    computedAt: toStr(r.computedAt),
  }
}

/** Normalize GET /v1/products/price-recommendations response */
export function normalizePriceRecommendationsResponse(raw: unknown): PriceRecommendationsResponse {
  const r = asRecord(raw)
  const items = Array.isArray(r.items) ? r.items : []
  return {
    items: items.map(toItem),
    total: toCount(r.total),
    nextCursor: toStringOrNull(r.nextCursor),
  }
}

/** Normalize single price recommendation (GET /v1/products/price-recommendations/{nmId}) */
export function normalizePriceRecommendation(raw: unknown): PriceRecommendation {
  return toItem(raw)
}
