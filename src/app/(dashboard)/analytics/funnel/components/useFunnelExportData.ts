'use client'

/**
 * Hook: fetches all funnel items (no pagination) and prepares CSV export data.
 * Extracted from FunnelPageContent for file-size compliance.
 */

import { useMemo } from 'react'
import type { FunnelProductItem } from '@/types/analytics-funnel'
import { useFunnelData } from '@/hooks/use-funnel-analytics'
import { exportFunnelToCsv } from '@/lib/csv/funnel-csv-export'

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
  const exportFilter = nmIds.length ? nmIds : undefined
  const { data: exportData } = useFunnelData(apiFrom, apiTo, {
    limit: 10000,
    nmIds: exportFilter,
  })
  const exportItems = useMemo(
    () => (exportData?.items ?? []) as FunnelProductItem[],
    [exportData?.items]
  )
  const csvContent = useMemo(() => exportFunnelToCsv(exportItems), [exportItems])
  const csvFileName = `funnel-${apiFrom}-${apiTo}.csv`

  return { exportItems, csvContent, csvFileName }
}
