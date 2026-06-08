/**
 * Returns Daily API Client
 *
 * Fetches daily return trend data from GET /v1/analytics/returns/daily.
 * Includes query keys factory and API function.
 */

import { apiClient } from '@/lib/api-client'
import { normalizeReturnsDailyResponse } from './returns-daily-normalizer'
import type { ReturnsDailyResponse } from '@/types/returns-daily'

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const returnsDailyQueryKeys = {
  all: ['returns-daily'] as const,
  trends: (from: string, to: string) => [...returnsDailyQueryKeys.all, 'trends', from, to] as const,
}

// ---------------------------------------------------------------------------
// API Function
// ---------------------------------------------------------------------------

/**
 * Fetch daily return trends with category breakdown.
 * GET /v1/analytics/returns/daily?from=...&to=...
 * Returns daily items, period, and summary.
 */
export async function getReturnsDailyTrends(
  from: string,
  to: string
): Promise<ReturnsDailyResponse> {
  const sp = new URLSearchParams({ from, to })

  const raw = await apiClient.get<unknown>(`/v1/analytics/returns/daily?${sp.toString()}`, {
    skipDataUnwrap: true,
  })

  return normalizeReturnsDailyResponse(raw)
}
