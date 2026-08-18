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
 */
export const PROFITABILITY_STATUS_CONFIG: Record<ProfitabilityStatus, ProfitabilityStatusConfig> = {
  excellent: {
    label: 'Отлично',
    labelShort: 'Отл.',
    color: 'var(--color-financial-positive)',
    bgClass: 'bg-financial-positive/15',
    textClass: 'text-financial-positive',
    icon: '🟢',
    minMargin: 25,
    maxMargin: Infinity,
  },
  good: {
    label: 'Хорошо',
    labelShort: 'Хор.',
    color: 'var(--color-status-information)',
    bgClass: 'bg-status-information/15',
    textClass: 'text-status-information',
    icon: '🟡',
    minMargin: 15,
    maxMargin: 25,
  },
  warning: {
    label: 'Внимание',
    labelShort: 'Вним.',
    color: 'var(--color-status-warning)',
    bgClass: 'bg-status-warning/15',
    textClass: 'text-status-warning',
    icon: '🟠',
    minMargin: 5,
    maxMargin: 15,
  },
  critical: {
    label: 'Критично',
    labelShort: 'Крит.',
    color: 'var(--color-status-error)',
    bgClass: 'bg-status-error/15',
    textClass: 'text-status-error',
    icon: '🔴',
    minMargin: 0,
    maxMargin: 5,
  },
  loss: {
    label: 'Убыток',
    labelShort: 'Убыт.',
    color: 'var(--color-financial-negative)',
    bgClass: 'bg-financial-negative/15',
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
 * Get profitability color
 */
export function getProfitabilityColor(status: ProfitabilityStatus): string {
  return getProfitabilityConfig(status).color
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
 * Get profitability background class only
 */
export function getProfitabilityBgClass(status: ProfitabilityStatus): string {
  return getProfitabilityConfig(status).bgClass
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
