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
 * Get profitability status config
 */
export function getProfitabilityConfig(status: ProfitabilityStatus): ProfitabilityStatusConfig {
  return PROFITABILITY_STATUS_CONFIG[status]
}

/**
 * Get profitability color
 */
export function getProfitabilityColor(status: ProfitabilityStatus): string {
  return PROFITABILITY_STATUS_CONFIG[status].color
}

/**
 * Get profitability label
 */
export function getProfitabilityLabel(status: ProfitabilityStatus): string {
  return PROFITABILITY_STATUS_CONFIG[status].label
}

/**
 * Get profitability badge classes
 */
export function getProfitabilityBadgeClasses(status: ProfitabilityStatus): string {
  const config = PROFITABILITY_STATUS_CONFIG[status]
  return `${config.bgClass} ${config.textClass}`
}

/**
 * Get profitability background class only
 */
export function getProfitabilityBgClass(status: ProfitabilityStatus): string {
  return PROFITABILITY_STATUS_CONFIG[status].bgClass
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

/** Format percentage value */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format currency value in RUB
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
