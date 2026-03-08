/**
 * Funnel Overlay Chart Configuration
 * Story 73.8-FE: Funnel + Advertising Chart Overlay
 *
 * Series definitions, colors, formatters, and data merge utility
 * for overlaying ad spend on the funnel time series chart.
 */

import type { FunnelDayItem } from '@/types/analytics-funnel'
import type { AdvertisingDailyItem } from '@/types/advertising-analytics'

// ============================================================================
// Colors (project design system conventions)
// ============================================================================

export const OVERLAY_COLORS = {
  openCardCount: '#60A5FA', // blue-400 — Просмотры
  ordersCount: '#FB923C', // orange-400 — Заказы
  buyoutCount: '#4ADE80', // green-400 — Выкупы
  adSpend: '#7C3AED', // purple — Advertising convention
} as const

export type OverlayMetricKey = keyof typeof OVERLAY_COLORS

// ============================================================================
// Series Configuration
// ============================================================================

export interface OverlaySeries {
  key: OverlayMetricKey
  label: string
  color: string
  axis: 'left' | 'right'
  strokeDasharray?: string
}

export const OVERLAY_SERIES: OverlaySeries[] = [
  { key: 'openCardCount', label: 'Просмотры', color: OVERLAY_COLORS.openCardCount, axis: 'left' },
  { key: 'ordersCount', label: 'Заказы', color: OVERLAY_COLORS.ordersCount, axis: 'left' },
  { key: 'buyoutCount', label: 'Выкупы', color: OVERLAY_COLORS.buyoutCount, axis: 'left' },
  {
    key: 'adSpend',
    label: 'Расходы на рекламу',
    color: OVERLAY_COLORS.adSpend,
    axis: 'right',
    strokeDasharray: '6 3',
  },
]

// ============================================================================
// Merged Data Type
// ============================================================================

export interface MergedChartDay {
  date: string
  openCardCount: number
  ordersCount: number
  buyoutCount: number
  totalConversion: number
  adSpend: number | null
}

// ============================================================================
// Data Merge Utility
// ============================================================================

/** Left-join funnel days with advertising daily data by date string */
export function mergeFunnelAndAdDaily(
  funnelDays: FunnelDayItem[],
  adDaily: AdvertisingDailyItem[] | undefined
): MergedChartDay[] {
  const adMap = new Map(adDaily?.map(d => [d.date, d]) ?? [])
  return funnelDays.map(day => ({
    date: day.date,
    openCardCount: day.openCardCount,
    ordersCount: day.ordersCount,
    buyoutCount: day.buyoutCount,
    totalConversion: day.totalConversion,
    adSpend: adMap.get(day.date)?.spend ?? null,
  }))
}

// ============================================================================
// Formatting Helpers
// ============================================================================

/** Format date as DD.MM for x-axis labels (string split avoids timezone issues) */
export function formatOverlayDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${d}.${m}`
}

/** Format compact currency for right Y-axis */
export function formatCompactRub(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', ',')}M ₽`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K ₽`
  return `${value} ₽`
}

/** Format compact count for left Y-axis */
export function formatCompactCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace('.', ',')}K`
  return value.toFixed(0)
}

/** Format full currency for tooltip */
export function fmtCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}
