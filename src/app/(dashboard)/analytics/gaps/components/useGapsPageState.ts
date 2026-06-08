'use client'

/**
 * Gaps page state hook
 * Manages date range and wires TanStack Query hooks
 */

import { useState, useCallback, useMemo } from 'react'
import { format, subDays } from 'date-fns'
import { useFinancialGaps, useAnalyzeGap, useRemediateGap } from '@/hooks/useFinancialGaps'
import type { GapAnalysisResponse } from '@/types/financial-gaps'

export function useGapsPageState() {
  const [dateFrom, setDateFrom] = useState(() => format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [analysisResult, setAnalysisResult] = useState<GapAnalysisResponse | null>(null)
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false)

  const queryParams = useMemo(() => ({ dateFrom, dateTo }), [dateFrom, dateTo])

  const gaps = useFinancialGaps(queryParams)
  const analyze = useAnalyzeGap()
  const remediate = useRemediateGap(queryParams)

  const handleAnalyze = useCallback(
    async (missingDate: string) => {
      const result = await analyze.mutateAsync(missingDate)
      setAnalysisResult(result)
      setAnalysisDialogOpen(true)
    },
    [analyze]
  )

  const handleRemediate = useCallback(
    async (missingDate: string, rootCause?: string) => {
      await remediate.mutateAsync({
        missing_date: missingDate,
        root_cause: rootCause,
        force: false,
      })
      setAnalysisDialogOpen(false)
      setAnalysisResult(null)
    },
    [remediate]
  )

  const updateDateRange = useCallback((from: string, to: string) => {
    setDateFrom(from)
    setDateTo(to)
  }, [])

  return {
    dateFrom,
    dateTo,
    gaps,
    analyze,
    remediate,
    analysisResult,
    analysisDialogOpen,
    setAnalysisDialogOpen,
    handleAnalyze,
    handleRemediate,
    updateDateRange,
  }
}
