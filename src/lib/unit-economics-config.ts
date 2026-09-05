/**
 * Unit Economics Configuration & Formatters
 * Epic 5 / Epic 74 - Extracted from unit-economics-utils.ts
 */

import type {
  ProfitabilityStatus,
  ProfitabilityStatusConfig,
  CostCategoryConfig,
  CostsPct,
} from '@/types/unit-economics'

/**
 * Profitability status display configuration (net margin % thresholds)
 * Story 168.11: token migration — one token set shared with the 168.9 legend and
 * sku-financials PROFITABILITY_COLORS/HEX (/15-chip idiom, 168.8 precedent).
 * bgColor hex field removed: no consumers outside tests (verified by grep, 168.11).
 *
 * P2 wave-3 (2026-09-05): failing chip tints /15→/5 per house rule — measured <4.5:1 light
 * (см. артефакт debt-p2-wave3-aa-quickwins / волна-2 canon). Colored-text-on-own-tint pairs,
 * обе темы над card: fin-pos/15 = 4.19 → /5 = 4.80 (8.72 dark); warning/15 = 3.97 (worst in
 * class) → /5 = 4.52 (12.23 dark); fin-neg/15 = 4.42 → /5 = 5.20 (8.19 dark). Retained /15 —
 * measured PASS обеих тем: status-information/15 = 4.62 light / 6.64 dark; status-error/15 =
 * 5.10 light / 8.22 dark. Diverges from the sku-financials /15-chip idiom for the 3 changed
 * entries only (that config pairs tints with text-foreground — the safe pattern, untouched).
 *
 * Pass-1 note: plain-card base verified (review-pass-1) — superseded by pass-2.
 * Pass-2 correction (review-pass-2, 2026-09-05): the chips do NOT always render on plain
 * card — on the SELECTED row the persistent base is card > bg-status-information/10
 * (UnitEconomicsTableRow.tsx:58). Re-measured in situ (card > info/10 > chip tint, light):
 * warning/5 = 3.93 FAIL, fin-pos/5 = 4.18 FAIL, info/15 = 4.06 FAIL, error/15 = 4.45 FAIL
 * → those four textClass fields are text-foreground (fg-on-tint over the selected stack =
 * 13.15 / 13.12 / 11.37 / 10.97 light, ≥11.12 dark; tints/borders kept — valence = tint +
 * label + icon). Retained colored: loss keeps text-financial-negative — fin-neg/5 = 4.52
 * light / 6.92 dark over the selected stack PASS (5.20 over plain card). Hover:bg-muted
 * (transient, documented exemption): retained loss chip = 4.78 light PASS; the changed
 * entries measured 4.16-4.42 over hover pre-fix — fg-on-tint eliminates the dip (>11 both
 * themes). Unknown sentinel (muted-foreground on bg-muted) = 7.17 over the selected stack.
 */
export const PROFITABILITY_STATUS_CONFIG: Record<ProfitabilityStatus, ProfitabilityStatusConfig> = {
  excellent: {
    label: 'Отлично',
    labelShort: 'Отл.',
    color: 'var(--color-financial-positive)',
    bgClass: 'bg-financial-positive/5',
    textClass: 'text-foreground',
    icon: '🟢',
    minMargin: 25,
    maxMargin: Infinity,
  },
  good: {
    label: 'Хорошо',
    labelShort: 'Хор.',
    color: 'var(--color-status-information)',
    bgClass: 'bg-status-information/15',
    textClass: 'text-foreground',
    icon: '🟡',
    minMargin: 15,
    maxMargin: 25,
  },
  warning: {
    label: 'Внимание',
    labelShort: 'Вним.',
    color: 'var(--color-status-warning)',
    bgClass: 'bg-status-warning/5',
    textClass: 'text-foreground',
    icon: '🟠',
    minMargin: 5,
    maxMargin: 15,
  },
  critical: {
    label: 'Критично',
    labelShort: 'Крит.',
    color: 'var(--color-status-error)',
    bgClass: 'bg-status-error/15',
    textClass: 'text-foreground',
    icon: '🔴',
    minMargin: 0,
    maxMargin: 5,
  },
  loss: {
    label: 'Убыток',
    labelShort: 'Убыт.',
    color: 'var(--color-financial-negative)',
    bgClass: 'bg-financial-negative/5',
    textClass: 'text-financial-negative',
    icon: '⚫',
    minMargin: -Infinity,
    maxMargin: 0,
  },
} as const

/**
 * Neutral sentinel config for unrecognized profitability status.
 * Used by getProfitabilityConfig for enum-drift defense (F-49).
 */
const UNKNOWN_PROFITABILITY_CONFIG: ProfitabilityStatusConfig = {
  label: 'Неизвестно',
  labelShort: 'Неизв.',
  color: 'var(--color-muted-foreground)',
  bgClass: 'bg-muted',
  textClass: 'text-muted-foreground',
  icon: '⚪',
  minMargin: 0,
  maxMargin: 0,
}

/**
 * Get profitability status config.
 * F-49: guard against backend enum-drift. profitability_status is backend-provided; an
 * out-of-union value (the F-39 crash class) would make PROFITABILITY_STATUS_CONFIG[status]
 * undefined → TypeError on .color/.label/.bgClass. Param widened to `string` so the runtime
 * value (not just the typed union) is guarded — the `as ProfitabilityStatus` cast only satisfies
 * the Record index signature; `?? UNKNOWN_PROFITABILITY_CONFIG` is what actually handles the
 * undefined miss. Unknown → neutral grey sentinel (see above), never a real margin band.
 */
export function getProfitabilityConfig(status: string): ProfitabilityStatusConfig {
  return PROFITABILITY_STATUS_CONFIG[status as ProfitabilityStatus] ?? UNKNOWN_PROFITABILITY_CONFIG
}

/**
 * Get profitability label
 */
export function getProfitabilityLabel(status: ProfitabilityStatus): string {
  return getProfitabilityConfig(status).label
}

/**
 * Get profitability badge classes
 */
export function getProfitabilityBadgeClasses(status: ProfitabilityStatus): string {
  const config = getProfitabilityConfig(status)
  return `${config.bgClass} ${config.textClass}`
}

/**
 * Determine profitability status from margin percentage
 */
export function getStatusFromMargin(marginPct: number): ProfitabilityStatus {
  if (marginPct >= 25) return 'excellent'
  if (marginPct >= 15) return 'good'
  if (marginPct >= 5) return 'warning'
  if (marginPct >= 0) return 'critical'
  return 'loss'
}

/** Cost categories for waterfall chart (ordered by typical impact) */
export const COST_CATEGORIES: CostCategoryConfig[] = [
  { key: 'cogs', label: 'Себестоимость', color: '#6366F1', group: 'cogs' },
  { key: 'commission', label: 'Комиссия WB', color: '#8B5CF6', group: 'wb_fees' },
  { key: 'logistics_delivery', label: 'Доставка', color: '#EC4899', group: 'wb_fees' },
  { key: 'logistics_return', label: 'Возвраты', color: '#F43F5E', group: 'wb_fees' },
  { key: 'storage', label: 'Хранение', color: '#F97316', group: 'wb_fees' },
  {
    key: 'delivery_to_warehouse',
    label: 'Доставка на склад',
    color: '#06B6D4',
    group: 'seller_costs',
  },
  { key: 'paid_acceptance', label: 'Приёмка', color: '#EAB308', group: 'wb_fees' },
  { key: 'penalties', label: 'Штрафы', color: '#EF4444', group: 'other' },
  { key: 'other_deductions', label: 'Прочие', color: '#6B7280', group: 'other' },
  { key: 'advertising', label: 'Реклама', color: '#14B8A6', group: 'other' },
]

/**
 * Get cost category config by key
 */
export function getCostCategoryConfig(key: keyof CostsPct): CostCategoryConfig | undefined {
  return COST_CATEGORIES.find(c => c.key === key)
}

// Formatters extracted to ./unit-economics-formatters.ts (200-line ESLint cap, batch 2)
export {
  formatPercentage,
  formatCurrency,
  formatCompactNumber,
  formatMargin,
} from './unit-economics-formatters'
