/**
 * Test fixtures for buyout daily trend hook.
 * Minimal valid response + populated response.
 */

import type { BuyoutDailyResponse } from '@/types/buyout-daily'

/** Minimal valid response with no daily data */
export const BUYOUT_DAILY_EMPTY: BuyoutDailyResponse = {
  daily: [],
  period: { from: '2026-01-01', to: '2026-01-31' },
  summary: {
    avgBuyoutRate: null,
    avgReturnRate: null,
    totalOrders: 0,
    totalReturns: 0,
  },
}

/** Populated response with sample daily data */
export const BUYOUT_DAILY_POPULATED: BuyoutDailyResponse = {
  daily: [
    { date: '2026-01-01', buyoutRate: 85.2, returnRate: 14.8, ordersCount: 120, returnsCount: 18 },
    { date: '2026-01-02', buyoutRate: 88.1, returnRate: 11.9, ordersCount: 95, returnsCount: 11 },
    { date: '2026-01-03', buyoutRate: 72.5, returnRate: 27.5, ordersCount: 140, returnsCount: 38 },
    { date: '2026-01-04', buyoutRate: null, returnRate: null, ordersCount: 0, returnsCount: 0 },
    { date: '2026-01-05', buyoutRate: 91.0, returnRate: 9.0, ordersCount: 200, returnsCount: 18 },
  ],
  period: { from: '2026-01-01', to: '2026-01-05' },
  summary: {
    avgBuyoutRate: 84.2,
    avgReturnRate: 15.8,
    totalOrders: 555,
    totalReturns: 85,
  },
}

/** Reusable date range for buyout daily tests */
export const BUYOUT_DAILY_FROM = '2026-01-01'
export const BUYOUT_DAILY_TO = '2026-01-05'
