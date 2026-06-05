/**
 * Reorder Recommendations empty-shape fixture.
 * Story-1 fixture seeding for new domains per CLAUDE.md Multi-Source Orchestration.
 */

import type {
  ReorderRecommendation,
  ReorderFulfillmentMetrics,
} from '@/types/reorder-recommendations'

/** Factory for a single reorder recommendation with all-safe defaults. */
export function emptyReorderRecommendation(
  overrides?: Partial<ReorderRecommendation>
): ReorderRecommendation {
  return {
    id: '',
    nmId: 0,
    recommendedQty: 0,
    currentStock: 0,
    inTransitQty: 0,
    avgDailyDemand: 0,
    demandSource: 'velocity',
    leadTimeDays: 0,
    coverageDays: 0,
    orderByDate: null,
    stockoutDate: null,
    status: 'pending',
    unitCostRub: null,
    totalReorderValue: null,
    computedAt: '',
    ...overrides,
  }
}

/** Factory for empty fulfillment metrics with all-safe defaults. */
export function emptyReorderMetrics(
  overrides?: Partial<ReorderFulfillmentMetrics>
): ReorderFulfillmentMetrics {
  return {
    totalPending: 0,
    totalOrdered: 0,
    totalReceived: 0,
    totalExpired: 0,
    avgHoursToOrder: null,
    avgHoursToReceive: null,
    reorderCoveragePct: 0,
    ...overrides,
  }
}
