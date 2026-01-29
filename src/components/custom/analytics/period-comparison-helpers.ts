/**
 * Period Comparison Helpers
 * Story 51.7-FE: Period Comparison UI
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Configuration and formatters for period comparison metrics table.
 */

import { ShoppingCart, Wallet, XCircle, Receipt } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PeriodMetrics, ComparisonMetrics } from '@/types/fbs-analytics'

// Re-export preset types and functions
export type { PeriodRange, ComparisonPreset } from './period-presets'
export { COMPARISON_PRESETS, formatDateRangeRu, calculatePresetPeriods } from './period-presets'

/** Metric configuration for display */
export interface MetricConfig {
  key: string
  label: string
  icon: LucideIcon
  getValue: (metrics: PeriodMetrics) => number
  getDelta: (comparison: ComparisonMetrics) => number
  getDeltaPct: (comparison: ComparisonMetrics) => number
  format: (value: number) => string
  formatDelta: (value: number) => string
  inverse: boolean
}

/** Format number with Russian locale */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value))
}

/** Format currency with Russian locale */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

/** Format percentage with Russian locale */
export function formatPercent(value: number): string {
  return `${value.toFixed(2).replace('.', ',')}%`
}

/** Format delta with sign */
export function formatDeltaWithSign(value: number, formatter: (v: number) => string): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatter(value)}`
}

/** Format delta percentage with sign */
export function formatDeltaPctWithSign(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1).replace('.', ',')}%`
}

/** Metric configurations for comparison table */
export const METRICS_CONFIG: MetricConfig[] = [
  {
    key: 'orders',
    label: 'Заказы',
    icon: ShoppingCart,
    getValue: m => m.ordersCount,
    getDelta: c => c.ordersChange,
    getDeltaPct: c => c.ordersChangePercent,
    format: formatNumber,
    formatDelta: v => formatDeltaWithSign(v, formatNumber),
    inverse: false,
  },
  {
    key: 'revenue',
    label: 'Выручка',
    icon: Wallet,
    getValue: m => m.revenue,
    getDelta: c => c.revenueChange,
    getDeltaPct: c => c.revenueChangePercent,
    format: formatCurrency,
    formatDelta: v => formatDeltaWithSign(v, formatCurrency),
    inverse: false,
  },
  {
    key: 'cancellationRate',
    label: 'Процент отмен',
    icon: XCircle,
    getValue: m => m.cancellationRate,
    getDelta: c => c.cancellationRateChange,
    getDeltaPct: c => c.cancellationRateChange,
    format: formatPercent,
    formatDelta: v => formatDeltaWithSign(v, formatPercent),
    inverse: true,
  },
  {
    key: 'avgOrderValue',
    label: 'Средний чек',
    icon: Receipt,
    getValue: m => m.avgOrderValue,
    getDelta: c => c.avgOrderValueChange,
    getDeltaPct: c => c.avgOrderValueChangePercent,
    format: formatCurrency,
    formatDelta: v => formatDeltaWithSign(v, formatCurrency),
    inverse: false,
  },
]

/** Determine delta color based on value and inverse flag */
export function getDeltaColor(value: number, inverse: boolean): string {
  if (value === 0) return 'text-gray-500'
  const isPositive = inverse ? value < 0 : value > 0
  return isPositive ? 'text-green-600' : 'text-red-600'
}

/** Determine delta background color for badge */
export function getDeltaBgColor(value: number, inverse: boolean): string {
  if (value === 0) return 'bg-gray-100'
  const isPositive = inverse ? value < 0 : value > 0
  return isPositive ? 'bg-green-50' : 'bg-red-50'
}
