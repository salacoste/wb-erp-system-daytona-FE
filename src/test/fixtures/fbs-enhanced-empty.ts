/**
 * Shared empty-fixture factories for FBS Enhanced Analytics tests.
 * Story 96.13-FE — Pattern 3 hygiene (CLAUDE.md § Multi-Source Orchestration).
 *
 * Mirrors the `monitor-empty.ts` precedent (Story 92.6-FE — first canonical
 * Pattern 3 module). Consumed by both unit tests and E2E helpers.
 *
 * Convention: money/ratio fields use null per CLAUDE.md anti-pattern #8
 *   (null = "unknown / not yet calculated"; 0 would mislead).
 *   Count fields use 0 (legitimate zero — zero stock/orders is meaningful).
 *   Dates/strings use empty string (matches normalizer fallback `toStr`).
 *
 * @see src/types/fbs-enhanced.ts
 * @see src/lib/api/fbs-enhanced-normalizer.ts
 * @see src/test/fixtures/monitor-empty.ts (Pattern 3 canonical — Story 92.6-FE)
 * @see src/test/fixtures/fbs-stock-empty.ts (Pattern 3 sibling — Story 96.11-FE)
 */

import type {
  FbsEnhancedResponse,
  FbsOrderStats,
  FbsStockAnalytics,
  FbsRegionalDataItem,
  FbsCalculatedMetrics,
  FbsFunnelData,
} from '@/types/fbs-enhanced'

// ---------------------------------------------------------------------------
// Per-section factories
// ---------------------------------------------------------------------------

/**
 * Empty order stats — counts = 0, ratios/money = null.
 * Triggers '—' rendering for buyoutRate, returnRate, averageOrderValue.
 */
export function emptyFbsOrderStats(): FbsOrderStats {
  return {
    totalOrders: 0,
    deliveredOrders: 0,
    returnedOrders: 0,
    buyoutRate: null, // ratio — null per CLAUDE.md anti-pattern #8
    returnRate: null, // ratio — null per CLAUDE.md anti-pattern #8
    averageOrderValue: null, // money — null per CLAUDE.md anti-pattern #8
  }
}

/**
 * Empty stock analytics — counts = 0, ratio = null.
 * Triggers '—' rendering for avgDaysOfCover.
 */
export function emptyFbsStockAnalytics(): FbsStockAnalytics {
  return {
    totalSkus: 0,
    totalUnits: 0,
    lowStockSkus: 0,
    outOfStockSkus: 0,
    avgDaysOfCover: null, // ratio — null per CLAUDE.md anti-pattern #8
  }
}

/**
 * Single empty regional data item — ratios = null, string = ''.
 * Useful for testing null-rendering (orderShare → '—', stockShare → '—').
 */
export function emptyFbsRegionalDataItem(): FbsRegionalDataItem {
  return {
    regionName: '',
    orderShare: null, // ratio — null per CLAUDE.md anti-pattern #8
    stockShare: null, // ratio — null per CLAUDE.md anti-pattern #8
  }
}

/**
 * Empty calculated metrics — all ratios = null.
 * Triggers '—' rendering for all 3 cards.
 */
export function emptyFbsCalculatedMetrics(): FbsCalculatedMetrics {
  return {
    turnoverRate: null, // ratio — null per CLAUDE.md anti-pattern #8
    stockCoverageDays: null, // ratio — null per CLAUDE.md anti-pattern #8
    ordersPerProduct: null, // ratio — null per CLAUDE.md anti-pattern #8
  }
}

/**
 * Empty funnel data — all counts = 0.
 * Counts are 0 (legitimate zero — no views is a meaningful state).
 */
export function emptyFbsFunnelData(): FbsFunnelData {
  return {
    productViews: 0,
    cartAdds: 0,
    orders: 0,
    deliveries: 0,
  }
}

// ---------------------------------------------------------------------------
// Full response factory
// ---------------------------------------------------------------------------

/**
 * Full empty response — all 5 sections empty, empty period/generatedAt.
 * Use to test page-level empty state or as baseline for section-specific overrides.
 */
export function emptyFbsEnhancedResponse(): FbsEnhancedResponse {
  return {
    orderStats: emptyFbsOrderStats(),
    stockAnalytics: emptyFbsStockAnalytics(),
    regionalData: [],
    calculatedMetrics: emptyFbsCalculatedMetrics(),
    funnelData: emptyFbsFunnelData(),
    period: { from: '', to: '' },
    generatedAt: '',
  }
}
