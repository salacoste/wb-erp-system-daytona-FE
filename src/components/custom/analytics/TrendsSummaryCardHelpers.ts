/**
 * Trends Summary Cards - Types and helper functions
 * Extracted from TrendsSummaryCards.tsx for file size compliance
 */

import { formatNumber } from '@/lib/fbs-analytics-utils'
import { formatPercentage } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

/** Summary data from FBS trends API */
export interface TrendsSummaryData {
  totalOrders: number
  totalRevenue: number
  avgDailyOrders: number
  cancellationRate: number
  returnRate?: number
  /** Optional delta values for period comparison */
  ordersDelta?: number
  revenueDelta?: number
  avgDailyDelta?: number
  cancellationDelta?: number
}

/** Props for TrendsSummaryCards component */
export interface TrendsSummaryCardsProps {
  data?: TrendsSummaryData | null
  periodDays?: number
  isLoading?: boolean
  className?: string
}

// ============================================================================
// Helper Functions
// ============================================================================

/** Get Russian period label based on days count */
export function getPeriodLabel(days?: number): string {
  if (!days) return ''
  if (days === 7) return 'за неделю'
  if (days === 30) return 'за 30 дней'
  if (days === 90) return 'за 90 дней'
  if (days === 365) return 'за год'
  return `за ${days} дней`
}

/** Get color class for cancellation rate based on thresholds */
export function getCancellationColor(rate: number): 'green' | 'yellow' | 'red' {
  if (rate < 5) return 'green'
  if (rate <= 10) return 'yellow'
  return 'red'
}

/** Format average daily orders (1 decimal if needed) */
export function formatAvgDaily(value: number): string {
  if (Number.isInteger(value)) return formatNumber(value)
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value)
}

/** Build delta tooltip in Russian locale — exported for unit-testing (iter-79) */
export function buildDeltaTooltip(delta: number | undefined): string | undefined {
  if (delta === undefined) return undefined
  return `Изменение к предыдущему периоду: ${delta > 0 ? '+' : ''}${formatPercentage(delta, 1)}`
}

/** Default summary values for null data */
export const DEFAULT_SUMMARY: TrendsSummaryData = {
  totalOrders: 0,
  totalRevenue: 0,
  avgDailyOrders: 0,
  cancellationRate: 0,
}
