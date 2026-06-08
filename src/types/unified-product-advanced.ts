/**
 * Unified Product Analytics — organic-share & incremental ROAS types (Story 120.7-FE).
 *
 * Request #177 RESOLVED 2026-06-02.
 * Split from unified-product.ts for 200-line ESLint cap compliance.
 */

// ============================================================
// Organic-Share (Story 120.7 — GET /organic-share)
// CorrelationResult[] — per-day organic/paid cart split
// ============================================================

/** Confidence level for cart estimation (orders-based). */
export type CorrelationConfidence = 'high' | 'medium' | 'low'

/** Per-campaign cart estimate within a correlation day. */
export interface CampaignCartEstimate {
  advertId: number
  adOrders: number
  spend: number
  estimatedAdCart: number | null
}

/** Single day correlation result — organic vs ad-attributed cart. */
export interface CorrelationDayItem {
  date: string
  nmId: string
  adOrders: number
  /** AP#8: null when funnel has <10 orders (low confidence). */
  estimatedAdCart: number | null
  organicCart: number
  confidence: CorrelationConfidence
  campaigns: CampaignCartEstimate[]
}

// ============================================================
// Incremental ROAS (Story 120.7 — GET /incremental-roas)
// ============================================================

/** iROAS effectiveness interpretation — thresholds from Story 70.4 AC-5. */
export type RoasInterpretation = 'highly_effective' | 'effective' | 'marginal' | 'ineffective'

/** Incremental ROAS result for a single nmId over a period. */
export interface IncrementalRoasData {
  nmId: string
  period: { from: string; to: string }
  totalRevenue: number
  estimatedOrganicRevenue: number
  adSpend: number
  incrementalRevenue: number
  /** AP#8: null when adSpend=0 (cannot divide by zero). */
  iROAS: number | null
  /** AP#8: null when iROAS is null. */
  interpretation: RoasInterpretation | null
  /** AP#8: null when no organic baseline exists. */
  organicCannibalizationPct: number | null
  totalOrders: number
  estimatedOrganicOrders: number
}
