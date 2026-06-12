'use client'

/**
 * Hook: fetches all funnel items (no pagination) and prepares CSV export data.
 * Extracted from FunnelPageContent for file-size compliance.
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { FunnelProductItem } from '@/types/analytics-funnel'
import { exportFunnelToCsv } from '@/lib/csv/funnel-csv-export'
import { FUNNEL_CACHE, funnelQueryKeys } from '@/lib/api/funnel-analytics'
import { fetchFunnelExportItems } from '@/lib/api/funnel-export'

interface UseFunnelExportDataReturn {
  exportItems: FunnelProductItem[]
  csvContent: string
  csvFileName: string
}

export function useFunnelExportData(
  apiFrom: string,
  apiTo: string,
  nmIds: number[]
): UseFunnelExportDataReturn {
  const { data } = useQuery({
    queryKey: [...funnelQueryKeys.all, 'export', { apiFrom, apiTo, nmIds }],
    queryFn: () => fetchFunnelExportItems(apiFrom, apiTo, nmIds),
    enabled: !!apiFrom && !!apiTo,
    staleTime: FUNNEL_CACHE.staleTime,
    gcTime: FUNNEL_CACHE.gcTime,
    retry: 1,
  })

  const exportItems = useMemo(() => data ?? [], [data])
  const csvContent = useMemo(() => exportFunnelToCsv(exportItems), [exportItems])
  const csvFileName = `funnel-${apiFrom}-${apiTo}.csv`

  return { exportItems, csvContent, csvFileName }
}
