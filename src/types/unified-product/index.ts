/**
 * Unified Product Analytics — barrel re-export
 * Stories 120.5 + 120.6 + 120.7-FE
 *
 * All existing imports from '@/types/unified-product' continue to work unchanged.
 */

// Core: tabs, funnel, advertising, organic, summary, response, shell
export type {
  UnifiedProductTab,
  FunnelDayItem,
  FunnelTotals,
  AdvDayItem,
  AdvTotals,
  CampaignBreakdown,
  OrganicDayItem,
  OrganicTotals,
  UnifiedProductSummary,
  UnifiedProductData,
  UnifiedProductShell,
} from './core'

export { UNIFIED_PRODUCT_TABS, UNIFIED_PRODUCT_TAB_LABELS } from './core'

// Organic-share & incremental ROAS (Story 120.7)
export type {
  CorrelationConfidence,
  CampaignCartEstimate,
  CorrelationDayItem,
  RoasInterpretation,
  IncrementalRoasData,
} from './organic-roas'
