/**
 * Unified Product Analytics empty-shape fixtures — Stories 120.5 + 120.6-FE.
 *
 * Pattern 3 (CLAUDE.md § Multi-Source Orchestration): Story-1 fixture seeding
 * for new domains. Mirrors funnel-empty.ts + search-empty.ts precedent.
 *
 * Story 120.6 extended the fixture with full section shapes verified against
 * the live /unified response (Request #177 RESOLVED 2026-06-02).
 */

import type {
  UnifiedProductData,
  UnifiedProductShell,
  FunnelDayItem,
  FunnelTotals,
  AdvDayItem,
  AdvTotals,
  CampaignBreakdown,
  OrganicDayItem,
  OrganicTotals,
  UnifiedProductSummary,
} from '@/types/unified-product'

// ============================================================
// Shell fixture (Story 120.5 backward compat)
// ============================================================

/** Empty product shell for a given nmId (defaults to a representative opaque id). */
export function emptyUnifiedProduct(overrides?: Partial<UnifiedProductShell>): UnifiedProductShell {
  return {
    nmId: '887604577',
    ...overrides,
  }
}

// ============================================================
// Section-level empty factories
// ============================================================

export function emptyFunnelDay(overrides?: Partial<FunnelDayItem>): FunnelDayItem {
  return {
    date: '2026-06-01',
    openCardCount: 0,
    addToCartCount: 0,
    ordersCount: 0,
    buyoutCount: 0,
    cancelCount: 0,
    cartConversion: null,
    orderConversion: null,
    buyoutConversion: null,
    cancelRate: null,
    totalConversion: null,
    ...overrides,
  }
}

export function emptyFunnelTotals(overrides?: Partial<FunnelTotals>): FunnelTotals {
  return {
    openCardCount: 0,
    addToCartCount: 0,
    ordersCount: 0,
    buyoutCount: 0,
    cancelCount: 0,
    avgCartConversion: null,
    avgOrderConversion: null,
    avgBuyoutConversion: null,
    ...overrides,
  }
}

export function emptyAdvDay(overrides?: Partial<AdvDayItem>): AdvDayItem {
  return {
    date: '2026-06-01',
    views: 0,
    clicks: 0,
    orders: 0,
    spend: 0,
    ctr: 0,
    cpc: 0,
    ...overrides,
  }
}

export function emptyAdvTotals(overrides?: Partial<AdvTotals>): AdvTotals {
  return {
    views: 0,
    clicks: 0,
    orders: 0,
    spend: 0,
    avgCtr: 0,
    avgCpc: 0,
    ...overrides,
  }
}

export function emptyCampaign(overrides?: Partial<CampaignBreakdown>): CampaignBreakdown {
  return { advertId: 0, views: 0, clicks: 0, orders: 0, spend: 0, ...overrides }
}

export function emptyOrganicDay(overrides?: Partial<OrganicDayItem>): OrganicDayItem {
  return { date: '2026-06-01', organicViews: 0, organicOrders: 0, ...overrides }
}

export function emptyOrganicTotals(overrides?: Partial<OrganicTotals>): OrganicTotals {
  return { organicViews: 0, organicOrders: 0, ...overrides }
}

export function emptySummary(overrides?: Partial<UnifiedProductSummary>): UnifiedProductSummary {
  return {
    organicTrafficShare: 0,
    adTrafficShare: 0,
    blendedConversion: 0,
    ...overrides,
  }
}

// ============================================================
// Full response fixture
// ============================================================

/** Full empty /unified response (all sections zeroed, no daily data). */
export function emptyUnifiedProductData(
  overrides?: Partial<UnifiedProductData>
): UnifiedProductData {
  return {
    nmId: '887604577',
    period: { from: '2026-06-01', to: '2026-06-07' },
    funnel: { dates: [], totals: emptyFunnelTotals() },
    advertising: { dates: [], totals: emptyAdvTotals(), campaigns: [] },
    organic: { dates: [], totals: emptyOrganicTotals() },
    summary: emptySummary(),
    ...overrides,
  }
}
