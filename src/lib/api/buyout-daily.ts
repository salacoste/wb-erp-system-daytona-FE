/**
 * Buyout Daily Trend API Client
 * GET /v1/analytics/buyout/daily?from=YYYY-MM-DD&to=YYYY-MM-DD
 */

import { apiClient } from '@/lib/api-client'
import { logger } from '@/lib/logger'
import { normalizeBuyoutDailyResponse } from './buyout-daily-normalizer'
import type { BuyoutDailyResponse } from '@/types/buyout-daily'

/**
 * Fetch daily buyout trend data for a date range.
 */
export async function getBuyoutDailyTrends(from: string, to: string): Promise<BuyoutDailyResponse> {
  logger.debug('[BuyoutDaily] Fetching:', { from, to })

  const raw = await apiClient.get<unknown>(`/v1/analytics/buyout/daily?from=${from}&to=${to}`, {
    skipDataUnwrap: true,
  })

  const response = normalizeBuyoutDailyResponse(raw)

  logger.debug('[BuyoutDaily] Response:', {
    days: response.daily.length,
    totalOrders: response.summary.totalOrders,
  })

  return response
}

// Query Keys Factory
export const buyoutDailyKeys = {
  all: ['buyout-daily'] as const,
  range: (from: string, to: string) => [...buyoutDailyKeys.all, from, to] as const,
}

// Cache config
export const BUYOUT_DAILY_CACHE = {
  staleTime: 60 * 1000,
  gcTime: 5 * 60 * 1000,
} as const
