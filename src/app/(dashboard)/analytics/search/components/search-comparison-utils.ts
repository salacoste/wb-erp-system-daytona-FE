/**
 * Search Comparison Delta Helpers
 * Mirrors buyout-comparison-utils (Story 127.4-FE) pattern.
 *
 * Pure functions for calculating period-over-period deltas
 * for search analytics metrics (search orders, CTR, share).
 */

import { differenceInDays, subDays, format } from 'date-fns'

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

export interface SearchDelta {
  percent: number
  direction: 'up' | 'down' | 'neutral'
}

/** Calculate percent change between current and previous values */
export function calculateSearchDelta(
  current: number | null,
  previous: number | null
): SearchDelta | null {
  if (current == null || previous == null) return null
  if (previous === 0) return { percent: 0, direction: 'neutral' }
  const percent = ((current - previous) / Math.abs(previous)) * 100
  if (percent > 0) return { percent, direction: 'up' }
  if (percent < 0) return { percent, direction: 'down' }
  return { percent: 0, direction: 'neutral' }
}

/** Format delta as "▲ 25,0%" / "▼ 5,7%" / "— 0,0%" */
export function formatDelta(delta: SearchDelta): string {
  const fmt = (n: number) =>
    n.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  if (delta.direction === 'neutral') return `— ${fmt(Math.abs(delta.percent))}%`
  const arrow = delta.direction === 'up' ? '▲' : '▼'
  return `${arrow} ${fmt(Math.abs(delta.percent))}%`
}

/** Get Tailwind color class for delta direction */
export function getDeltaColor(direction: 'up' | 'down' | 'neutral'): string {
  if (direction === 'neutral') return 'text-muted-foreground'
  return direction === 'up' ? 'text-green-600' : 'text-red-600'
}
