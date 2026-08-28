/**
 * Monitor Metrics Table — pure utilities
 * Epic 92-FE Story 92.3: Extracted per 180-line split trigger.
 *
 * Contains: computeDelta, hasAnomaly, getAnomalyPeriods and shared types.
 * Row definitions & buildRows extracted to ./monitor-metrics-config.ts (200-line cap, batch 2).
 */

import { formatPercentage } from '@/lib/utils'
import type { MonitorSummaryResponse, PeriodMetrics } from '../types/monitor-summary'

export type Direction = 'higher-is-better' | 'higher-is-worse'

export interface Delta {
  label: string
  arrow: '↑' | '↓' | null
  colorClass: string
}

export interface AnomalyPeriod {
  key: string
  label: string
  cogs: number | null
  revenue: number | null
  margin: number | null
}

const PERIOD_LABELS: Record<string, string> = {
  today: 'сегодня',
  yesterday: 'вчера',
  last30Days: '30 дней',
  prev30Days: 'пред. 30 дней',
}

/**
 * Pure helper: computes percentage delta between two period values.
 * Null-safe: returns "—" if either value is null or previous is 0.
 * Zero-change returns neutral muted label with no arrow (fix M-4).
 * Exported for direct unit testing (pure-functions-over-hook-mocking pattern).
 */
export function computeDelta(
  current: number | null,
  previous: number | null,
  direction: Direction
): Delta {
  if (current == null || previous == null || previous === 0) {
    return { label: '—', arrow: null, colorClass: 'text-muted-foreground' }
  }
  const change = ((current - previous) / Math.abs(previous)) * 100
  // Neutral when exactly zero — no arrow, muted color (fix M-4)
  if (change === 0) {
    return { label: '0.0%', arrow: null, colorClass: 'text-muted-foreground' }
  }
  const arrow: '↑' | '↓' = change >= 0 ? '↑' : '↓'
  const improving =
    (direction === 'higher-is-better' && change >= 0) ||
    (direction === 'higher-is-worse' && change < 0)
  return {
    label: `${change >= 0 ? '+' : ''}${formatPercentage(change, 1)}`,
    arrow,
    colorClass: improving ? 'text-status-success' : 'text-status-error',
  }
}

/**
 * Detects anomaly in a period: cogs > revenue OR margin > revenue.
 * Guard-capture pattern — no ! assertions (CLAUDE.md anti-pattern #2).
 * Advisory: cogs > revenue can occur legitimately (e.g., loss-making periods).
 * The anomaly indicator renders a warning; no backend ticket needed unless
 * frequency exceeds expected thresholds across cabinets.
 */
export function hasAnomaly(p: PeriodMetrics): boolean {
  const cogsExceeds = p.cogs != null && p.revenue != null && p.cogs > p.revenue
  const marginExceeds = p.margin != null && p.revenue != null && p.margin > p.revenue
  return cogsExceeds || marginExceeds
}

/**
 * Returns list of periods where an anomaly is detected, with enough context to
 * render a specific tooltip (fix H-2: enriched anomaly tooltip with offending periods).
 */
export function getAnomalyPeriods(periods: MonitorSummaryResponse['periods']): AnomalyPeriod[] {
  const result: AnomalyPeriod[] = []
  for (const [key, period] of Object.entries(periods)) {
    const cogsExceeds =
      period.cogs != null && period.revenue != null && period.cogs > period.revenue
    const marginExceeds =
      period.margin != null && period.revenue != null && period.margin > period.revenue
    if (cogsExceeds || marginExceeds) {
      result.push({
        key,
        label: PERIOD_LABELS[key] ?? key,
        cogs: period.cogs,
        revenue: period.revenue,
        margin: period.margin,
      })
    }
  }
  return result
}

// Re-export from extracted config module
export { ROW_DIRECTIONS, buildRows } from './monitor-metrics-config'
export type { RowDef } from './monitor-metrics-config'
