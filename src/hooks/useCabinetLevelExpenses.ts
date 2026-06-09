'use client'

import { logger } from '@/lib/logger'

/**
 * Hook for cabinet-level expenses
 * Epic 74: Extracted from useMarginAnalytics.ts for file size compliance
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { CabinetLevelExpenses } from './margin-analytics-query-keys'

/**
 * Hook to fetch cabinet-level expenses
 * These are expenses that cannot be attributed to specific SKUs (nm_id='UNKNOWN')
 *
 * Endpoint: GET /v1/analytics/cabinet-expenses?weekStart=YYYY-Www&weekEnd=YYYY-Www
 *
 * @returns Query result with cabinet-level expenses breakdown
 */
export function useCabinetLevelExpenses(filters: { weekStart?: string; weekEnd?: string }) {
  const { weekStart, weekEnd } = filters

  return useQuery({
    queryKey: ['analytics', 'cabinet-expenses', { weekStart, weekEnd }],
    queryFn: async (): Promise<CabinetLevelExpenses> => {
      try {
        const params = new URLSearchParams()
        if (weekStart) params.append('weekStart', weekStart)
        if (weekEnd) params.append('weekEnd', weekEnd)

        logger.debug('[Cabinet Expenses] Fetching cabinet-level expenses:', {
          weekStart,
          weekEnd,
        })

        // Response structure: { data: CabinetLevelExpenses }
        // Endpoint is under WeeklyAnalyticsController prefix: v1/analytics/weekly
        const response = await apiClient.get<{ data: CabinetLevelExpenses } | CabinetLevelExpenses>(
          `/v1/analytics/weekly/cabinet-expenses?${params.toString()}`
        )

        // Handle wrapped response
        const expenses =
          'data' in response &&
          response.data &&
          typeof response.data === 'object' &&
          'storage' in response.data
            ? response.data
            : (response as CabinetLevelExpenses)

        logger.debug('[Cabinet Expenses] Received:', expenses)

        return expenses
      } catch (error) {
        logger.error('[Cabinet Expenses] Failed to fetch:', error)
        throw error
      }
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
    enabled: !!(weekStart && weekEnd),
  })
}
