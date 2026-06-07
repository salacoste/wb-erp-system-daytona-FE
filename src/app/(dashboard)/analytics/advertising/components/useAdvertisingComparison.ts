'use client'

import { useMemo, useCallback, useState } from 'react'
import { useAdvertisingAnalytics } from '@/hooks/useAdvertisingAnalytics'
import type {
  AdvertisingAnalyticsResponse,
  ViewByMode,
  GroupByMode,
} from '@/types/advertising-analytics'
import type { ComparisonPreset } from '@/components/custom/comparison-period/comparison-period-types'
import {
  calculatePreviousPeriod,
  calculateAdvertisingDeltas,
} from '../utils/comparison-delta-utils'
import type { AdvertisingDeltas } from '../utils/comparison-delta-utils'

/**
 * Comparison period state and delta computation for the advertising page.
 * Story 127.3-FE: Extracted from useAdvertisingPageState to stay under 200 lines.
 */
export function useAdvertisingComparison(
  comparisonEnabled: boolean,
  dateFrom: string,
  dateTo: string,
  viewBy: ViewByMode,
  groupBy: GroupByMode,
  currentSummary: AdvertisingAnalyticsResponse['summary'] | undefined
) {
  const [comparisonPreset, setComparisonPreset] = useState<ComparisonPreset>('previous')
  const [compareStart, setCompareStart] = useState('')
  const [compareEnd, setCompareEnd] = useState('')

  const prevPeriod = useMemo(
    () => (comparisonEnabled ? calculatePreviousPeriod(dateFrom, dateTo) : null),
    [comparisonEnabled, dateFrom, dateTo]
  )

  const { data: prevData } = useAdvertisingAnalytics(
    {
      from: prevPeriod?.from ?? '',
      to: prevPeriod?.to ?? '',
      view_by: viewBy,
      group_by: groupBy,
      limit: 1,
    },
    { enabled: comparisonEnabled && !!prevPeriod }
  )

  const deltas: AdvertisingDeltas | null = useMemo(
    () =>
      comparisonEnabled ? calculateAdvertisingDeltas(currentSummary, prevData?.summary) : null,
    [comparisonEnabled, currentSummary, prevData?.summary]
  )

  const handleCompareRangeChange = useCallback((start: string, end: string) => {
    setCompareStart(start)
    setCompareEnd(end)
  }, [])

  return {
    comparisonPreset,
    setComparisonPreset,
    compareStart,
    compareEnd,
    handleCompareRangeChange,
    deltas,
    prevSummary: prevData?.summary as AdvertisingAnalyticsResponse['summary'] | undefined,
  }
}
