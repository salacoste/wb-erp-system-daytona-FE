/**
 * Returns Daily Trend fixtures — empty-shape and factory.
 *
 * Pattern 3 (CLAUDE.md § Multi-Source Orchestration): Story-1 fixture seeding
 * for new domains. Follows funnel-empty.ts precedent.
 *
 * Counts use 0 (legitimate zero per AP#8 SEMANTIC-ZERO).
 */

import type {
  ReturnsDailyResponse,
  DailyReturnItem,
  ReturnsDailySummary,
} from '@/types/returns-daily'

/** Empty returns daily response: no returns in the period. */
export function emptyReturnsDailyResponse(
  overrides?: Partial<ReturnsDailyResponse>
): ReturnsDailyResponse {
  const summary: ReturnsDailySummary = {
    totalReturns: 0,
    avgReturnRate: 0,
    totalCancellations: 0,
    totalRefusals: 0,
    totalDefects: 0,
  }
  return {
    daily: [],
    period: { from: '', to: '' },
    summary,
    ...overrides,
  }
}

/** Factory for a single daily return row with sensible defaults. */
export function makeDailyReturnItem(overrides?: Partial<DailyReturnItem>): DailyReturnItem {
  return {
    date: '2026-06-01',
    totalReturns: 0,
    returnRate: 0,
    cancellations: 0,
    refusals: 0,
    defects: 0,
    ...overrides,
  }
}

/** Factory for a populated daily return item. */
export function makePopulatedDailyReturnItem(
  overrides?: Partial<DailyReturnItem>
): DailyReturnItem {
  return {
    date: '2026-06-01',
    totalReturns: 10,
    returnRate: 5.2,
    cancellations: 4,
    refusals: 3,
    defects: 3,
    ...overrides,
  }
}
