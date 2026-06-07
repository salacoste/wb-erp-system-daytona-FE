/**
 * Shared empty-fixture factories for FBS Enhanced Analytics tests.
 * Epic 129-FE Story 129.3 — updated to match real backend contract per Request #202.
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
 * Triggers '—' rendering for buyoutRate, cancelRate, avgOrderValue,
 * ordersSumRub, addToCartPercent, ordersPercent.
 */
export function emptyFbsOrderStats(): FbsOrderStats {
  return {
    ordersCount: 0,
    ordersSumRub: null, // money — null per CLAUDE.md anti-pattern #8
    cancelCount: 0,
    cancelRate: null, // ratio — null per CLAUDE.md anti-pattern #8
    buyoutCount: 0,
    buyoutRate: null, // ratio — null per CLAUDE.md anti-pattern #8
    avgOrderValue: null, // money — null per CLAUDE.md anti-pattern #8
    addToCartPercent: null, // ratio — null per CLAUDE.md anti-pattern #8
    ordersPercent: null, // ratio — null per CLAUDE.md anti-pattern #8
  }
}

/**
 * Empty stock analytics — all counts = 0.
 * No ratio fields in this section (all are counts per Request #202).
 */
export function emptyFbsStockAnalytics(): FbsStockAnalytics {
  return {
    totalStock: 0,
    availableStock: 0,
    reservedStock: 0,
    inTransit: 0,
    productCount: 0,
  }
}

/**
 * Single empty regional data item — string = '', percentage = null.
 * Useful for testing null-rendering (percentage → '—').
 */
export function emptyFbsRegionalDataItem(): FbsRegionalDataItem {
  return {
    region: '',
    quantity: 0,
    percentage: null, // ratio — null per CLAUDE.md anti-pattern #8
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
 * Empty funnel data — both conversion rates = null.
 * Ratios are null per CLAUDE.md anti-pattern #8 (no data = unknown).
 */
export function emptyFbsFunnelData(): FbsFunnelData {
  return {
    addToCartPercent: null, // ratio — null per CLAUDE.md anti-pattern #8
    ordersPercent: null, // ratio — null per CLAUDE.md anti-pattern #8
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
