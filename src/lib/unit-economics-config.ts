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

/** Profitability status display configuration (net margin % thresholds) */
export const PROFITABILITY_STATUS_CONFIG: Record<ProfitabilityStatus, ProfitabilityStatusConfig> = {
  excellent: {
    label: 'Отлично',
    labelShort: 'Отл.',
    color: '#22C55E', // green-500
    bgColor: '#DCFCE7', // green-100
    bgClass: 'bg-green-500',
    textClass: 'text-white',
    icon: '🟢',
    minMargin: 25,
    maxMargin: Infinity,
  },
  good: {
    label: 'Хорошо',
    labelShort: 'Хор.',
    color: '#84CC16', // lime-500
    bgColor: '#ECFCCB', // lime-100
    bgClass: 'bg-lime-500',
    textClass: 'text-white',
    icon: '🟡',
    minMargin: 15,
    maxMargin: 25,
  },
  warning: {
    label: 'Внимание',
    labelShort: 'Вним.',
    color: '#EAB308', // yellow-500
    bgColor: '#FEF9C3', // yellow-100
    bgClass: 'bg-yellow-500',
    textClass: 'text-white',
    icon: '🟠',
    minMargin: 5,
    maxMargin: 15,
  },
  critical: {
    label: 'Критично',
    labelShort: 'Крит.',
    color: '#F97316', // orange-500
    bgColor: '#FFEDD5', // orange-100
    bgClass: 'bg-orange-500',
    textClass: 'text-white',
    icon: '🔴',
    minMargin: 0,
    maxMargin: 5,
  },
  loss: {
    label: 'Убыток',
    labelShort: 'Убыт.',
    color: '#EF4444', // red-500
    bgColor: '#FEE2E2', // red-100
    bgClass: 'bg-red-500',
    textClass: 'text-white',
    icon: '⚫',
    minMargin: -Infinity,
    maxMargin: 0,
  },
} as const

/**
 * Neutral sentinel config for an unrecognized profitability status (F-49).
 * Deliberately NOT one of the five real margin bands — a drifted value must render in neutral
 * grey, visually distinct from 'warning' (yellow "Внимание", 5-15 % band), so it INDICATES the
 * anomaly rather than MISLABELLING it as a real band (Defensive Frontend Principle). Mirrors the
 * grey raw-value fallback in OrderStatusBadge's getSupplierStatusConfig.
 */
export const UNKNOWN_PROFITABILITY_CONFIG: ProfitabilityStatusConfig = {
  label: 'Неизвестно',
  labelShort: 'Неизв.',
  color: '#6B7280', // gray-500
  bgColor: '#F3F4F6', // gray-100
  bgClass: 'bg-gray-400',
  textClass: 'text-white',
  icon: '⚪',
  // Sentinel — NOT a real band. These bounds are placeholders only; consumers must not use
  // them for range-membership checks (getStatusFromMargin owns margin→status mapping).
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

/**
 * Format percentage value in Russian locale (e.g. 15.5 → "15,5 %").
 * iter-58: was `${value.toFixed(1)}%` → "15.5%" (dot decimal, no space) — a Russian-locale
 * violation (frontend/CLAUDE.md: formatPercentage(15.5) → "15,5 %"). `value` is already in
 * percent units (0-100), matching the canonical `@/lib/utils` formatPercentage domain; we
 * format with Intl `style:'percent'` over value/100 to get the comma decimal + NBSP separator.
 * NOTE: kept as a local copy (not a re-export of `@/lib/utils` formatPercentage) ON PURPOSE —
 * this one pins min=max=decimals (default exactly 1 decimal) for right-aligned table-column
 * alignment, whereas the canonical allows 1-2 decimals. Do NOT "harmonize" by re-exporting.
 */
export function formatPercentage(value: number, decimals = 1): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

/**
 * Format currency value in RUB (whole rubles — maxFractionDigits:0 is a deliberate
 * declutter choice for this page, distinct from the canonical `@/lib/utils` formatCurrency).
 *
 * FUTURE (iter-58 deferred — needs a product decision): `value === 0 → '—'` masks a GENUINE
 * 0₽ as "no data" (anti-pattern #8-adjacent). `item.revenue` (UnitEconomicsTableRow.tsx) and
 * `summary.total_revenue`/`total_your_price` (UnitEconomicsSummaryCards.tsx) flow here UNGUARDED,
 * so a real zero-sales SKU renders "—" indistinguishable from missing. Resolve the UX question
 * (show "0 ₽" vs "—" vs row-suppress) before changing — entangled with the whole-ruble design.
 */
export function formatCurrency(value: number): string {
  if (value === 0) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatCompactNumber(value: number): string {
  if (value === 0) return '0'
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return value.toFixed(0)
}

/**
 * Format margin with sign and color hint
 */
export function formatMargin(marginPct: number): { text: string; className: string } {
  const sign = marginPct > 0 ? '+' : ''
  const text = `${sign}${marginPct.toFixed(1)}%`

  if (marginPct >= 25) return { text, className: 'text-green-600' }
  if (marginPct >= 15) return { text, className: 'text-lime-600' }
  if (marginPct >= 5) return { text, className: 'text-yellow-600' }
  if (marginPct >= 0) return { text, className: 'text-orange-600' }
  return { text, className: 'text-red-600' }
}
