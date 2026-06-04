/**
 * Unified Product Analytics — domain types (Story 120.5-FE shell).
 *
 * Marketing Plan §3.3 "Product Analytics Page". This file seeds the new
 * `unified-product` domain. The route shell (120.5) ships now; the real data
 * contract will be defined by Story 120.6-FE VERIFY-FIRST against the live
 * `/unified` response (Request #177 is RESOLVED 2026-06-02 — routes live) — do
 * NOT speculatively expand the data shape here (verify-first per Epic 117 A-1).
 */

/** Tab identifiers for the per-product analytics home. Order = display order. */
export const UNIFIED_PRODUCT_TABS = ['overview', 'funnel', 'advertising', 'organic'] as const

export type UnifiedProductTab = (typeof UNIFIED_PRODUCT_TABS)[number]

/** Russian tab labels (single source of truth for the shell + future data stories). */
export const UNIFIED_PRODUCT_TAB_LABELS: Record<UnifiedProductTab, string> = {
  overview: 'Обзор',
  funnel: 'Воронка',
  advertising: 'Реклама',
  organic: 'Органика',
}

/**
 * Minimal shell shape — just the opaque product identifier. Story 120.6-FE
 * replaces/extends this with the verified per-section data contract from #177.
 * `nmId` is an opaque ID (string) — render via String(), never formatNumber (AP#10).
 */
export interface UnifiedProductShell {
  nmId: string
}
