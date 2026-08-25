/**
 * Route-local efficiency/campaign-status token maps — Story 170.1
 *
 * 169.10/169.13 pattern (supply-risk-tokens precedent): lib files
 * (efficiency-utils, campaign-utils) keep classification/labels/icons and stay
 * READ-ONLY — the 3-way lockstep dashboard/widget consumers still read their
 * legacy palette channels. This route stops consuming those channels
 * (getRoasColorClass / getEfficiencyConfig colors / getCampaignStatusDotColor)
 * and maps the same classifications to design-system tokens here.
 *
 * Tier assignment (6 + unknown, tier-collapse guarded):
 *   excellent → solid success (best)
 *   good      → soft success (/15, 169.5 pair canon)
 *   moderate  → soft warning
 *   poor      → solid warning (worse than moderate)
 *   loss      → solid error (worst)
 *   unknown   → muted (visible-unknown, preface #218/#226)
 */

import type { EfficiencyStatus } from '@/types/advertising-analytics'

export interface EfficiencyTierTokens {
  /** Badge surface + text (EfficiencyBadge, 169.9 solid-chip canon). */
  chip: string
  /** Icon / inline text color (summary cards, icons). */
  icon: string
}

export const EFFICIENCY_TIER_TOKENS: Record<EfficiencyStatus, EfficiencyTierTokens> = {
  excellent: {
    chip: 'bg-status-success text-status-success-foreground',
    icon: 'text-status-success',
  },
  good: { chip: 'bg-status-success/15 text-status-success', icon: 'text-status-success' },
  moderate: { chip: 'bg-status-warning/15 text-status-warning', icon: 'text-status-warning' },
  poor: { chip: 'bg-status-warning text-status-warning-foreground', icon: 'text-status-warning' },
  loss: { chip: 'bg-status-error text-status-error-foreground', icon: 'text-status-error' },
  unknown: { chip: 'bg-muted text-muted-foreground', icon: 'text-muted-foreground' },
}

/**
 * ROAS inline text color — same 5-band thresholds as lib getRoasColorClass
 * (iter-119 canonical bands), tokens from the tier map. Null/NaN → muted.
 */
export function getRoasTierTextClass(roas: number | null | undefined): string {
  if (roas == null || isNaN(roas)) return 'text-muted-foreground'
  if (roas >= 5.0) return EFFICIENCY_TIER_TOKENS.excellent.icon
  if (roas >= 3.0) return EFFICIENCY_TIER_TOKENS.good.icon
  if (roas >= 2.0) return EFFICIENCY_TIER_TOKENS.moderate.icon
  if (roas >= 1.0) return EFFICIENCY_TIER_TOKENS.poor.icon
  return EFFICIENCY_TIER_TOKENS.loss.icon
}

/**
 * ROI inline text color — percent-domain thresholds (iter-84) preserved.
 * Bands: ≥50 success, ≥20 warning, ≥0 warning (weak-but-positive gets
 * attention — old palette was text-orange-600), <0 error.
 *
 * DELIBERATE 5→3 inline-text collapse (3-status-token canon, round-1 F1/F2):
 * old green/emerald (excellent/good) collapse to one success text, old
 * yellow/orange (moderate/poor) collapse to one warning text. The 6-tier
 * distinction lives in the CHIP domain (EFFICIENCY_TIER_TOKENS solid/soft
 * pairs); inline text carries only 3 statuses + error, so the 0-20 vs 20-50
 * bands sharing text-status-warning is intentional, not a regression.
 */
export function getRoiTextClass(roi: number): string {
  if (roi >= 50) return 'text-status-success'
  if (roi >= 20) return 'text-status-warning'
  if (roi >= 0) return 'text-status-warning'
  return 'text-status-error'
}

/**
 * Campaign status dot color — WB status codes (Story 33.5 AC2) mapped to
 * status tokens; unknown codes → muted (was bg-gray-400 fallback).
 */
const CAMPAIGN_STATUS_DOT_TOKENS: Record<number, string> = {
  9: 'bg-status-success', // Active
  11: 'bg-status-warning', // Paused
  7: 'bg-muted-foreground', // Ended
  4: 'bg-status-information', // Ready to launch
  8: 'bg-status-error', // Declined
}

export function getCampaignStatusDotToken(status: number): string {
  return CAMPAIGN_STATUS_DOT_TOKENS[status] ?? 'bg-muted-foreground'
}
