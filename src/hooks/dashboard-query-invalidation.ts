'use client'

import type { QueryClient } from '@tanstack/react-query'
import { comparisonQueryKeys } from '@/lib/api/analytics-comparison'
import { fulfillmentQueryKeys } from '@/lib/api/fulfillment'
import { advertisingQueryKeys } from '@/hooks/advertising/query-keys'
import { dashboardQueryKeys } from './useDashboard'

export const dashboardRefreshQueryKeys = [
  dashboardQueryKeys.all,
  ['analytics'] as const,
  ['financial'] as const,
  fulfillmentQueryKeys.all,
  advertisingQueryKeys.all,
  comparisonQueryKeys.all,
  ['processing-status'] as const,
] as const

export function invalidateDashboardDataQueries(queryClient: QueryClient): void {
  dashboardRefreshQueryKeys.forEach(queryKey => {
    void queryClient.invalidateQueries({ queryKey })
  })
}
