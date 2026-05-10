/**
 * Monitor Metrics Table — pure utilities
 * Epic 92-FE Story 92.3: Extracted per 180-line split trigger.
 *
 * Contains: computeDelta, hasAnomaly, getAnomalyPeriods, buildRows and shared types.
 * Rule-of-two: if Story 92.4 also needs computeDelta, keep here (already extracted).
 */

import type { MonitorSummaryResponse, PeriodMetrics } from '../types/monitor-summary'

export type Direction = 'higher-is-better' | 'higher-is-worse'

export interface Delta {
  label: string
  arrow: '↑' | '↓' | null
  colorClass: string
}

export interface RowDef {
  key: string
  label: string
  direction: Direction
  values: {
    today: number | null
    yesterday: number | null
    last30: number | null
    prev30: number | null
  }
  isMoney: boolean
}

export interface AnomalyPeriod {
  key: string
  label: string
  cogs: number | null
  revenue: number | null
  margin: number | null
}

/** Single source of truth for which metrics are higher-is-better vs higher-is-worse (fix L-2). */
export const ROW_DIRECTIONS = {
  orders: 'higher-is-better',
  sales: 'higher-is-better',
  revenue: 'higher-is-better',
  cogs: 'higher-is-worse',
  expenses: 'higher-is-worse',
  margin: 'higher-is-better',
  returns: 'higher-is-worse',
} as const satisfies Record<string, Direction>

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
    label: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
    arrow,
    colorClass: improving ? 'text-green-600' : 'text-red-600',
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

/** Builds the 7 static row definitions from the 4-period data. */
export function buildRows(periods: MonitorSummaryResponse['periods']): RowDef[] {
  const { today, yesterday, last30Days, prev30Days } = periods
  return [
    {
      key: 'orders',
      label: 'Заказы',
      direction: ROW_DIRECTIONS.orders,
      values: {
        today: today.salesCount + today.returnsCount,
        yesterday: yesterday.salesCount + yesterday.returnsCount,
        last30: last30Days.salesCount + last30Days.returnsCount,
        prev30: prev30Days.salesCount + prev30Days.returnsCount,
      },
      isMoney: false,
    },
    {
      key: 'sales',
      label: 'Продажи',
      direction: ROW_DIRECTIONS.sales,
      values: {
        today: today.salesCount,
        yesterday: yesterday.salesCount,
        last30: last30Days.salesCount,
        prev30: prev30Days.salesCount,
      },
      isMoney: false,
    },
    {
      key: 'revenue',
      label: 'Выручка',
      direction: ROW_DIRECTIONS.revenue,
      values: {
        today: today.revenue,
        yesterday: yesterday.revenue,
        last30: last30Days.revenue,
        prev30: prev30Days.revenue,
      },
      isMoney: true,
    },
    {
      key: 'cogs',
      label: 'Продажи по себестоимости',
      direction: ROW_DIRECTIONS.cogs,
      values: {
        today: today.cogs,
        yesterday: yesterday.cogs,
        last30: last30Days.cogs,
        prev30: prev30Days.cogs,
      },
      isMoney: true,
    },
    {
      key: 'expenses',
      label: 'Расходы',
      direction: ROW_DIRECTIONS.expenses,
      values: {
        today: today.expenses,
        yesterday: yesterday.expenses,
        last30: last30Days.expenses,
        prev30: prev30Days.expenses,
      },
      isMoney: true,
    },
    {
      key: 'margin',
      label: 'Маржа',
      direction: ROW_DIRECTIONS.margin,
      values: {
        today: today.margin,
        yesterday: yesterday.margin,
        last30: last30Days.margin,
        prev30: prev30Days.margin,
      },
      isMoney: true,
    },
    {
      key: 'returns',
      label: 'Возвраты',
      direction: ROW_DIRECTIONS.returns,
      values: {
        today: today.returnsCount,
        yesterday: yesterday.returnsCount,
        last30: last30Days.returnsCount,
        prev30: prev30Days.returnsCount,
      },
      isMoney: false,
    },
  ]
}
