/**
 * WoW (week-over-week) delta computation for the finance-history grid.
 * Pure + unit-tested so the cell component stays a thin presenter.
 *
 * - `currency` rows → relative change (%): `calculateChange` of the two values.
 * - `percent` rows → percentage-POINTS delta (a difference of two percentages is
 *   in п.п., not %): formatted via `formatPercentagePoints`.
 *
 * Goodness coloring is decided by the consumer using `tone` + `isNegativeMetric`
 * (mirrors the ChangeIndicator convention, anti-pattern: don't color by sign alone).
 */

import { calculateChange } from '@/hooks/financial'
import { formatPercentage, formatPercentagePoints } from '@/lib/utils'
import type { FinanceHistoryRowKind } from './finance-history-rows'

export type DeltaTone = 'up' | 'down' | 'same'

export interface WowDelta {
  text: string
  tone: DeltaTone
}

/**
 * @param current  this week's value (currency ₽, or percent 0–100)
 * @param previous previous week's value (same units), or null/undefined for the oldest column
 */
export function computeWowDelta(
  kind: FinanceHistoryRowKind,
  current: number | null,
  previous: number | null | undefined
): WowDelta | null {
  // No left-neighbor (oldest column) or no current value → nothing to compare.
  if (current == null || previous == null || previous === undefined) return null

  if (kind === 'percent') {
    const diff = current - previous
    if (diff === 0) return { text: formatPercentagePoints(0), tone: 'same' }
    return { text: formatPercentagePoints(diff), tone: diff > 0 ? 'up' : 'down' }
  }

  // currency: relative change
  const change = calculateChange(current, previous)
  if (change.percentage === null) return null
  const sign = change.percentage > 0 ? '+' : ''
  return {
    text: `${sign}${formatPercentage(change.percentage, 1)}`,
    tone: change.trend,
  }
}

/** Tailwind text-color class for a delta, honoring inverted (negative) metrics. */
export function deltaColorClass(tone: DeltaTone, isNegativeMetric: boolean): string {
  if (tone === 'same') return 'text-muted-foreground'
  const good = tone === 'up'
  const positive = isNegativeMetric ? !good : good
  return positive ? 'text-green-600' : 'text-red-600'
}
