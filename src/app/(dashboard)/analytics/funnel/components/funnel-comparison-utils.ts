/** Funnel WoW comparison helpers — Story 73.3-FE */

import { differenceInDays, subDays, format } from 'date-fns'

/** Metrics where an increase is negative (red) */
const INVERTED_METRICS = new Set(['cancelCount'])

export function isInvertedMetric(field: string): boolean {
  return INVERTED_METRICS.has(field)
}

/** Shift a date range back by its own duration to get the previous period */
export function calculatePreviousPeriod(from: string, to: string) {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const days = differenceInDays(toDate, fromDate) + 1
  const prevTo = subDays(fromDate, 1)
  const prevFrom = subDays(prevTo, days - 1)
  return {
    prevFrom: format(prevFrom, 'yyyy-MM-dd'),
    prevTo: format(prevTo, 'yyyy-MM-dd'),
  }
}

export interface FunnelDelta {
  percent: number
  direction: 'up' | 'down' | 'neutral'
}

/** Calculate percent change between current and previous values */
export function calculateFunnelDelta(current: number, previous: number): FunnelDelta {
  if (previous === 0) return { percent: 0, direction: 'neutral' }
  const percent = ((current - previous) / Math.abs(previous)) * 100
  if (percent > 0) return { percent, direction: 'up' }
  if (percent < 0) return { percent, direction: 'down' }
  return { percent: 0, direction: 'neutral' }
}

/** Format delta as "↑ 25,0%" / "↓ 5,7%" / "— 0,0%" */
export function formatDelta(delta: FunnelDelta): string {
  const fmt = (n: number) =>
    n.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  if (delta.direction === 'neutral') return `— ${fmt(Math.abs(delta.percent))}%`
  const arrow = delta.direction === 'up' ? '↑' : '↓'
  return `${arrow} ${fmt(Math.abs(delta.percent))}%`
}

/** Get Tailwind color class for delta direction (flips for inverted metrics) */
export function getDeltaColor(direction: 'up' | 'down' | 'neutral', inverted: boolean): string {
  if (direction === 'neutral') return 'text-muted-foreground'
  const isPositive = inverted ? direction === 'down' : direction === 'up'
  return isPositive ? 'text-financial-positive' : 'text-financial-negative'
}
