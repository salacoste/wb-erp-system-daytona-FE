/**
 * Comparison Delta Utilities — Story 127.3-FE
 *
 * Pure functions for calculating advertising metric deltas between
 * current and previous periods. Follows funnel-comparison-utils pattern.
 */

import { differenceInDays, subDays, format } from 'date-fns'
import type { AdvertisingSummary } from '@/types/advertising-analytics'

/** Delta result for a single metric */
export interface AdvertisingDelta {
  percent: number
  direction: 'up' | 'down' | 'neutral'
}

/** Map of metric key to its delta */
export type AdvertisingDeltas = Partial<Record<ComparisonMetricKey, AdvertisingDelta>>

/** Metrics available for comparison */
export type ComparisonMetricKey =
  'total_spend' | 'total_revenue' | 'overall_roas' | 'total_sales' | 'avg_ctr'

/** Metrics where a decrease is positive (spend going down is good) */
const INVERTED_METRICS: Set<string> = new Set(['total_spend'])

/**
 * Calculate the previous period by shifting the date range back by its own duration.
 * Identical logic to funnel-comparison-utils.calculatePreviousPeriod.
 */
export function calculatePreviousPeriod(from: string, to: string): { from: string; to: string } {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const days = differenceInDays(toDate, fromDate) + 1
  const prevTo = subDays(fromDate, 1)
  const prevFrom = subDays(prevTo, days - 1)
  return {
    from: format(prevFrom, 'yyyy-MM-dd'),
    to: format(prevTo, 'yyyy-MM-dd'),
  }
}

/** Calculate percent change between current and previous values */
export function calculateAdDelta(current: number, previous: number): AdvertisingDelta {
  if (previous === 0) return { percent: 0, direction: 'neutral' }
  const percent = ((current - previous) / Math.abs(previous)) * 100
  if (percent > 0) return { percent, direction: 'up' }
  if (percent < 0) return { percent, direction: 'down' }
  return { percent: 0, direction: 'neutral' }
}

/** Extract a numeric value from summary by metric key */
function getMetricValue(summary: AdvertisingSummary, key: ComparisonMetricKey): number {
  const val = summary[key]
  // null values (e.g. overall_roas) treated as 0 for delta purposes
  return val ?? 0
}

/**
 * Calculate deltas for all comparable metrics between current and previous summaries.
 * Returns null if either summary is missing.
 */
export function calculateAdvertisingDeltas(
  current: AdvertisingSummary | undefined,
  previous: AdvertisingSummary | undefined
): AdvertisingDeltas | null {
  if (!current || !previous) return null

  const keys: ComparisonMetricKey[] = [
    'total_spend',
    'total_revenue',
    'overall_roas',
    'total_sales',
    'avg_ctr',
  ]

  const deltas: AdvertisingDeltas = {}
  for (const key of keys) {
    const cur = getMetricValue(current, key)
    const prev = getMetricValue(previous, key)
    deltas[key] = calculateAdDelta(cur, prev)
  }
  return deltas
}

/** Format delta as "↑ 25,0%" / "↓ 5,7%" / "— 0,0%" (Russian locale) */
export function formatAdDelta(delta: AdvertisingDelta): string {
  const fmt = (n: number) =>
    n.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  if (delta.direction === 'neutral') return `— ${fmt(Math.abs(delta.percent))}%`
  const arrow = delta.direction === 'up' ? '↑' : '↓'
  return `${arrow} ${fmt(Math.abs(delta.percent))}%`
}

/** Whether a metric is inverted (decrease = good) */
export function isInvertedAdMetric(key: string): boolean {
  return INVERTED_METRICS.has(key)
}

/** Get Tailwind color class for delta direction. Story 170.1: → status tokens. */
export function getAdDeltaColor(direction: 'up' | 'down' | 'neutral', inverted: boolean): string {
  if (direction === 'neutral') return 'text-muted-foreground'
  const isPositive = inverted ? direction === 'down' : direction === 'up'
  return isPositive ? 'text-status-success' : 'text-status-error'
}
