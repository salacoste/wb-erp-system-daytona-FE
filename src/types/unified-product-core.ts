/**
 * Unified Product Analytics — core domain types (Stories 120.5 + 120.6-FE).
 *
 * AP#8 split: counts → number (SEMANTIC-ZERO, ?? 0 OK); ratios/rates/money →
 * number | null (nullable-unknown, renders '—').
 */

// ============================================================
// Tab shell (Story 120.5)
// ============================================================

/** Tab identifiers for the per-product analytics home. Order = display order. */
export const UNIFIED_PRODUCT_TABS = ['overview', 'funnel', 'advertising', 'organic'] as const

export type UnifiedProductTab = (typeof UNIFIED_PRODUCT_TABS)[number]

/** Russian tab labels (single source of truth for the shell + data stories). */
export const UNIFIED_PRODUCT_TAB_LABELS: Record<UnifiedProductTab, string> = {
  overview: 'Обзор',
  funnel: 'Воронка',
  advertising: 'Реклама',
  organic: 'Органика',
}

// ============================================================
// Funnel section (backend: FunnelDayData / FunnelTotals)
// ============================================================

/** Single day of funnel metrics (views → cart → orders → buyouts → cancels). */
export interface FunnelDayItem {
  date: string
  openCardCount: number
  addToCartCount: number
  ordersCount: number
  buyoutCount: number
  cancelCount: number
  /** AP#8: nullable ratio — null when funnel has no cards (0/0). */
  cartConversion: number | null
  orderConversion: number | null
  buyoutConversion: number | null
  cancelRate: number | null
  totalConversion: number | null
}

/** Period totals — latest-synced representative row (NOT sum of daily replicas). */
export interface FunnelTotals {
  openCardCount: number
  addToCartCount: number
  ordersCount: number
  buyoutCount: number
  cancelCount: number
  avgCartConversion: number | null
  avgOrderConversion: number | null
  avgBuyoutConversion: number | null
}

// ============================================================
// Advertising section (backend: AdvDayData / AdvTotals / CampaignBreakdown)
// ============================================================

/** Single day of advertising metrics aggregated across campaigns. */
export interface AdvDayItem {
  date: string
  views: number
  clicks: number
  orders: number
  spend: number
  ctr: number
  cpc: number
}

/** Period advertising totals. */
export interface AdvTotals {
  views: number
  clicks: number
  orders: number
  spend: number
  avgCtr: number
  avgCpc: number
}

/** Per-campaign breakdown. */
export interface CampaignBreakdown {
  advertId: number
  views: number
  clicks: number
  orders: number
  spend: number
}

// ============================================================
// Organic section (computed: funnel − advertising, floored to 0)
// ============================================================

/** Single day organic data. */
export interface OrganicDayItem {
  date: string
  organicViews: number
  organicOrders: number
}

/** Period organic totals. */
export interface OrganicTotals {
  organicViews: number
  organicOrders: number
}

// ============================================================
// Summary section
// ============================================================

/** High-level traffic split and blended conversion. */
export interface UnifiedProductSummary {
  organicTrafficShare: number
  adTrafficShare: number
  blendedConversion: number
}

// ============================================================
// Full response (Story 120.6 — VERIFY-FIRST verified)
// ============================================================

/** The canonical frontend shape for GET /unified. */
export interface UnifiedProductData {
  nmId: string
  period: { from: string; to: string }
  funnel: { dates: FunnelDayItem[]; totals: FunnelTotals }
  advertising: { dates: AdvDayItem[]; totals: AdvTotals; campaigns: CampaignBreakdown[] }
  organic: { dates: OrganicDayItem[]; totals: OrganicTotals }
  summary: UnifiedProductSummary
}

// ============================================================
// Shell (Story 120.5 minimal shape — kept for fixture backward compat)
// ============================================================

/**
 * Minimal shell shape — just the opaque product identifier.
 * Story 120.6 extends this with the full data contract above.
 */
export interface UnifiedProductShell {
  nmId: string
}
