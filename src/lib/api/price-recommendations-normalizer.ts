/**
 * Price Recommendations Boundary Normalizer
 * Coerces raw backend responses into frontend-canonical shapes.
 * Uses shared helpers from normalizer-helpers.ts.
 */

import { toCount, toNullableNumber, toStringOrNull, toStr, asRecord } from './normalizer-helpers'
import type {
  PriceRecommendation,
  PriceRecommendationsResponse,
  PriceRecommendationHistoryPoint,
} from '@/types/price-recommendations'

function toItem(raw: unknown): PriceRecommendation {
  const r = asRecord(raw)
  return {
    id: toStr(r.id),
    nmId: toCount(r.nmId),
    vendorCode: toStringOrNull(r.vendorCode),
    productName: toStringOrNull(r.productName),
    lastPrice: toNullableNumber(r.lastPrice),
    // AP#8: money/ratio fields preserve null — null renders '—' / 'недостаточно данных'.
    breakEvenPrice: toNullableNumber(r.breakEvenPrice),
    recommendedPrice: toNullableNumber(r.recommendedPrice),
    marginAtCurrentPct: toNullableNumber(r.marginAtCurrentPct),
    marginAtRecommendedPct: toNullableNumber(r.marginAtRecommendedPct),
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

function toHistoryRow(raw: unknown): PriceRecommendationHistoryPoint {
  const r = asRecord(raw)
  return {
    weekStart: toStr(r.weekStart),
    lastPrice: toNullableNumber(r.lastPrice),
    recommendedPrice: toNullableNumber(r.recommendedPrice),
    breakEvenPrice: toNullableNumber(r.breakEvenPrice),
    marginAtCurrentPct: toNullableNumber(r.marginAtCurrentPct),
    marginAtRecPct: toNullableNumber(r.marginAtRecPct),
    gap: toNullableNumber(r.gap),
    gapPct: toNullableNumber(r.gapPct),
    targetMarginPct: toNullableNumber(r.targetMarginPct) ?? 0,
    recomputationCount: toCount(r.recomputationCount),
  }
}

/**
 * Normalize GET /v1/products/price-recommendations/{nmId}/history response.
 * Backend returns DESC order; reverses to ASC for chart continuity.
 */
export function normalizePriceRecommendationHistory(
  raw: unknown
): PriceRecommendationHistoryPoint[] {
  if (!Array.isArray(raw)) return []
  return raw.map(toHistoryRow).reverse()
}
