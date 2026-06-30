/**
 * Persona hero KPI sets (TZ-5).
 *
 * Each persona's ≤6 hero KPIs (spec persona-dashboard-rework-spec.md §4C), resolved from
 * the dashboard grid props. The lead metric (first in each list) renders largest in the hero.
 *
 * Notes on scope (TZ-5):
 * - COGS coverage is NOT a hero tile here — `CogsCoverageMetricCard` is the canonical COGS
 *   indicator in the hero region (Change E, TZ-6).
 * - Ops persona deferrals (spec §4C lists 5 Ops KPIs; TZ-5 ships 3 — the ≤6 AC is met):
 *   • "Stock health" lead — no single stockout-risk value in DashboardMetricsGridProps (it lives
 *     in inventory data); Ops uses Orders as the operational lead until inventory integration.
 *   • "Fulfillment (FBO/FBS)" — d.fboShare/d.fbsShare exist but are not part of
 *     DashboardMetricsGridProps (the hero's input); a fulfillment tile needs share-plumbing into
 *     the hero. Both are follow-ups.
 *
 * @see docs/ux/IMPLEMENTATION-TZ.md (TZ-5)
 */

import { getNetProfit } from '@/lib/tax-display-helpers'
import type { Persona } from '@/stores/persona-presets'
import type { DashboardMetricsGridProps } from './DashboardMetricsGridTypes'

export type HeroKpiFormat = 'currency' | 'percent' | 'pcs'

export type HeroKpiId =
  | 'netProfit'
  | 'wbRevenue'
  | 'revenue'
  | 'margin'
  | 'orders'
  | 'returns'
  | 'storage'
  | 'operating'
  | 'grossMargin'
  | 'payout'

export interface HeroKpiDef {
  id: HeroKpiId
  label: string
  format: HeroKpiFormat
  /** Lead metrics render larger in the hero. Exactly one per persona (the first entry). */
  lead?: boolean
}

/**
 * Per-persona hero KPI ordering. The first entry is the lead (largest). Source: spec §4C.
 */
export const PERSONA_HERO_KPIS: Record<Persona, HeroKpiDef[]> = {
  Owner: [
    { id: 'netProfit', label: 'Чистая прибыль', format: 'currency', lead: true },
    { id: 'wbRevenue', label: 'Выкупы', format: 'currency' },
    { id: 'margin', label: 'Маржа', format: 'percent' },
    { id: 'orders', label: 'Заказы', format: 'pcs' },
  ],
  Ops: [
    { id: 'orders', label: 'Заказы', format: 'pcs', lead: true },
    { id: 'returns', label: 'Возвраты', format: 'currency' },
    { id: 'storage', label: 'Хранение', format: 'currency' },
  ],
  CFO: [
    { id: 'netProfit', label: 'Чистая прибыль', format: 'currency', lead: true },
    { id: 'operating', label: 'Опер. прибыль', format: 'currency' },
    { id: 'grossMargin', label: 'Валовая маржа', format: 'percent' },
    { id: 'revenue', label: 'Выручка', format: 'currency' },
    { id: 'payout', label: 'К перечислению', format: 'currency' },
  ],
}

function resolveNetProfit(p: DashboardMetricsGridProps) {
  const operating = p.operatingProfitAnalytical ?? p.grossProfit
  const hasData = p.payoutTotal != null || p.taxMetrics != null || operating != null
  return hasData ? getNetProfit(p.taxMetrics ?? null, p.payoutTotal ?? 0, operating) : null
}

/** Resolve a hero KPI's raw numeric value from grid props (null when unavailable). */
export function resolveHeroKpiValue(id: HeroKpiId, p: DashboardMetricsGridProps): number | null {
  switch (id) {
    case 'netProfit':
      return resolveNetProfit(p)?.value ?? null
    case 'wbRevenue':
      return p.wbSalesGross ?? null
    case 'revenue':
      return p.saleGross ?? null
    case 'margin':
      return p.operatingMarginPct ?? p.marginPct ?? null
    case 'orders':
      return p.totalOrders ?? null
    case 'returns':
      return p.wbReturnsGross ?? null
    case 'storage':
      return p.storageCost ?? null
    case 'operating':
      return p.operatingProfitAnalytical ?? null
    case 'grossMargin':
      return p.grossMarginPct ?? null
    case 'payout':
      return p.payoutTotal ?? null
    default:
      return null
  }
}

export interface ResolvedHeroKpi {
  def: HeroKpiDef
  value: number | null
  label: string
}

export function resolveHeroKpiLabel(id: HeroKpiId, p: DashboardMetricsGridProps): string | null {
  if (id !== 'netProfit') return null

  const result = resolveNetProfit(p)
  if (!result) return null
  return `${result.label}${result.isPreTax ? ' (до налога)' : ''}`
}

/** Resolve the full hero KPI list (defs + values) for a persona. */
export function getPersonaHeroKpis(
  persona: Persona,
  props: DashboardMetricsGridProps
): ResolvedHeroKpi[] {
  return PERSONA_HERO_KPIS[persona].map(def => ({
    def,
    value: resolveHeroKpiValue(def.id, props),
    label: resolveHeroKpiLabel(def.id, props) ?? def.label,
  }))
}
