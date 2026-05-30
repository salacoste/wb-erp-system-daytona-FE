/**
 * Funnel Analytics empty-shape fixtures — Story 119.2-FE Pass-1 F-2
 * Pattern 3 (CLAUDE.md § Multi-Source Orchestration): Story-1 fixture seeding
 * for new domains. Originating precedent: Story 92.6-FE (retroactive-extraction
 * tax avoidance). Mirrors src/test/fixtures/monitor-empty.ts (Story 92.1-FE) +
 * src/test/fixtures/search-empty.ts (Story 119.1-FE). Closes Story 119.1 Pass-2
 * P2-5 same-class repeat-occurrence flagged in Story 119.2 Pass-1 F-2.
 *
 * Story 119.2-FE Pass-2 P2-6: AP#8 SEMANTIC-ZERO allowlist comment template
 * documented inline (see ratio field blocks below). Closes the downstream
 * copy-paste hazard — a hook author writing against nullable backend ratios
 * needs the canonical eslint-disable-next-line format to refer to.
 *
 * Convention: counts use 0 (legitimate zero per AP#8); money/ratio fields would
 * use null but `FunnelSummary` carries only counts and ratios that are
 * meaningful as 0 in the "no traffic" empty state (cartConversion etc. are
 * percentages displayed as 0% when nothing has happened — not the
 * unknown/null/em-dash class). This is the SEMANTIC-ZERO canonical case.
 *
 * --- CLAUDE-PATTERNS.md AP#8 SEMANTIC-ZERO allowlist comment template ---
 * A fixture default of 0 for ratios represents "known-zero baseline" (an empty
 * period has 0% conversion by construction), distinct from null which would
 * mean "unknown/missing data". Downstream code that ENCOUNTERS nullable backend
 * ratios MUST preserve null per AP#8:
 *
 *   // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: <rationale>
 *   cartConversion: response.cartConversion ?? 0  // ONLY if API contract guarantees non-null
 *
 * The `<rationale>` slot must cite the canonical pattern (e.g.,
 * `SEMANTIC-ZERO: empty-period baseline; cartConversion is 0% by construction
 * when no card opens occurred — distinct from "unknown/missing"`).
 * Canonical examples: CLAUDE-PATTERNS.md § Anti-Pattern #8 Exceptions
 * (Story 106.3-FE) categorizes 6 exception patterns; SEMANTIC-ZERO is one.
 */

import type {
  FunnelProductItem,
  FunnelResponse,
  FunnelSummary,
  TopSearchQuery,
} from '@/types/analytics-funnel'

/** Empty funnel response: no SKUs in the period. */
export function emptyFunnelResponse(overrides?: Partial<FunnelResponse>): FunnelResponse {
  const summary: FunnelSummary = {
    openCardCount: 0,
    addToCartCount: 0,
    ordersCount: 0,
    ordersSumRub: 0,
    buyoutCount: 0,
    buyoutSumRub: 0,
    cancelCount: 0,
    cancelSumRub: 0,
    cartConversion: 0,
    orderConversion: 0,
    buyoutConversion: 0,
    cancelRate: 0,
    totalConversion: 0,
  }
  return {
    items: [],
    summary,
    pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
    ...overrides,
  }
}

/** Factory for a single funnel product row with sensible all-zero defaults. */
export function makeFunnelProductItem(overrides?: Partial<FunnelProductItem>): FunnelProductItem {
  return {
    nmId: 887604577,
    vendorCode: 'izoblack_20',
    brandName: 'Protape',
    openCardCount: 0,
    addToCartCount: 0,
    ordersCount: 0,
    ordersSumRub: 0,
    buyoutCount: 0,
    buyoutSumRub: 0,
    cancelCount: 0,
    cancelSumRub: 0,
    cartConversion: 0,
    orderConversion: 0,
    buyoutConversion: 0,
    cancelRate: 0,
    totalConversion: 0,
    ...overrides,
  }
}

/** Factory for a single top-search-query entry — the new field shipped in Story 119.2-FE. */
export function makeTopSearchQuery(overrides?: Partial<TopSearchQuery>): TopSearchQuery {
  return {
    query: 'тест',
    impressions: 0,
    clicks: 0,
    orders: 0,
    ...overrides,
  }
}
