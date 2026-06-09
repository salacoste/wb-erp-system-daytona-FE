/**
 * Efficiency Status Accessor Helpers
 * Extracted from efficiency-utils.ts for file-size compliance.
 * Simple accessor wrappers around efficiencyConfig.
 */

import type { LucideIcon } from 'lucide-react'
import type { EfficiencyStatus } from '@/types/advertising-analytics'
import { efficiencyConfig, type EfficiencyConfig } from '@/lib/efficiency-utils'

/**
 * Validation F-47: guarded efficiency-config accessor. `efficiency_status` is backend-
 * provided (item.efficiency_status), so an out-of-union value (enum drift — the F-39 crash
 * class, where the backend sent a status the FE union lacked) would make
 * `efficiencyConfig[status]` undefined -> a TypeError on `.icon`/`.textColor`/`.label`. Fall
 * back to the 'unknown' config for any unrecognized status. Accepts a plain string so the
 * runtime value (not just the typed union) is guarded.
 */
export function getEfficiencyConfig(status: string): EfficiencyConfig {
  return efficiencyConfig[status as EfficiencyStatus] ?? efficiencyConfig.unknown
}

/**
 * Canonical ROAS -> inline-text-color mapping. Single source of truth so the dashboard
 * AdvertisingCard, the advertising widget, and the analytics advertising page agree
 * (iter-119: resolved a 3-way threshold divergence where ROAS=4 rendered green on the
 * analytics page but yellow on the dashboard card).
 *
 * `roas` is a raw MULTIPLIER (e.g. 4.2x, rendered "4,2x" via formatRoas), NOT a percent.
 * Bands + colors mirror efficiencyConfig (the documented business logic, "colors per AC2"):
 *   >=5  Отлично  -> green    (excellent)
 *   3-5 Хорошо   -> emerald  (good)
 *   2-3 Умеренно -> yellow   (moderate)
 *   1-2 Слабо    -> orange   (poor)
 *   <1  Убыток   -> red      (loss)
 * Derived from each band's `iconColor` (the -600 inline shade, NOT the -800 badge textColor)
 * so the mapping stays in lockstep with the config. null/NaN -> muted, so callers may pass an
 * unguarded value.
 */
export function getRoasColorClass(roas: number | null | undefined): string {
  if (roas == null || isNaN(roas)) return 'text-muted-foreground'
  if (roas >= 5.0) return efficiencyConfig.excellent.iconColor
  if (roas >= 3.0) return efficiencyConfig.good.iconColor
  if (roas >= 2.0) return efficiencyConfig.moderate.iconColor
  if (roas >= 1.0) return efficiencyConfig.poor.iconColor
  return efficiencyConfig.loss.iconColor
}

/** Get efficiency status color class for inline text styling */
export function getEfficiencyColor(status: EfficiencyStatus): string {
  return getEfficiencyConfig(status).textColor
}

/** Get efficiency status label */
export function getEfficiencyLabel(status: EfficiencyStatus): string {
  return getEfficiencyConfig(status).label
}

/** Get efficiency status icon component */
export function getEfficiencyIcon(status: EfficiencyStatus): LucideIcon {
  return getEfficiencyConfig(status).icon
}

/** Get efficiency status recommendation */
export function getEfficiencyRecommendation(status: EfficiencyStatus): string {
  return getEfficiencyConfig(status).recommendation
}

/** Check if status requires attention (poor, loss, or unknown) */
export function isAttentionRequired(status: EfficiencyStatus): boolean {
  return status === 'poor' || status === 'loss' || status === 'unknown'
}

/** Check if status is negative (loss-making) */
export function isLossStatus(status: EfficiencyStatus): boolean {
  return status === 'loss'
}
