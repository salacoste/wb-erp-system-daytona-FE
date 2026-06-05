/**
 * Reorder Recommendations Boundary Normalizer
 * Coerces raw backend responses into frontend-canonical shapes.
 * Uses shared helpers from normalizer-helpers.ts.
 */

import { toCount, toNullableNumber, toStringOrNull, toStr, asRecord } from './normalizer-helpers'
import type {
  ReorderRecommendation,
  ReorderFulfillmentMetrics,
} from '@/types/reorder-recommendations'

function toDemandSource(raw: unknown): 'ml' | 'velocity' {
  return raw === 'ml' || raw === 'velocity' ? raw : 'velocity'
}

function toReorderStatus(raw: unknown): 'pending' | 'ordered' | 'received' | 'expired' {
  if (raw === 'pending' || raw === 'ordered' || raw === 'received' || raw === 'expired') return raw
  return 'pending'
}

function toItem(raw: unknown): ReorderRecommendation {
  const r = asRecord(raw)
  return {
    id: toStr(r.id),
    nmId: toCount(r.nmId),
    recommendedQty: toCount(r.recommendedQty),
    currentStock: toCount(r.currentStock),
    inTransitQty: toCount(r.inTransitQty),
    avgDailyDemand: toNullableNumber(r.avgDailyDemand) ?? 0,
    demandSource: toDemandSource(r.demandSource),
    leadTimeDays: toCount(r.leadTimeDays),
    coverageDays: toCount(r.coverageDays),
    orderByDate: toStringOrNull(r.orderByDate),
    stockoutDate: toStringOrNull(r.stockoutDate),
    status: toReorderStatus(r.status),
    unitCostRub: toNullableNumber(r.unitCostRub),
    totalReorderValue: toNullableNumber(r.totalReorderValue),
    computedAt: toStr(r.computedAt),
  }
}

/** Normalize GET /v1/analytics/reorder-recommendations response */
export function normalizeReorderRecommendationsResponse(raw: unknown): ReorderRecommendation[] {
  if (!Array.isArray(raw)) return []
  return raw.map(toItem)
}

/** Normalize GET /v1/analytics/reorder-recommendations/metrics response */
export function normalizeReorderMetricsResponse(raw: unknown): ReorderFulfillmentMetrics {
  const r = asRecord(raw)
  return {
    totalPending: toCount(r.totalPending),
    totalOrdered: toCount(r.totalOrdered),
    totalReceived: toCount(r.totalReceived),
    totalExpired: toCount(r.totalExpired),
    avgHoursToOrder: toNullableNumber(r.avgHoursToOrder),
    avgHoursToReceive: toNullableNumber(r.avgHoursToReceive),
    reorderCoveragePct: toNullableNumber(r.reorderCoveragePct) ?? 0,
  }
}
