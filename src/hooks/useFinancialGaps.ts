'use client'

/**
 * TanStack Query hooks for Financial Gaps Remediation
 * useFinancialGaps, useAnalyzeGap, useRemediateGap
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFinancialGaps, analyzeGap, remediateGap } from '@/lib/api/financial-gaps'
import type { GapsQueryParams, RemediatePayload } from '@/types/financial-gaps'

const gapsKeys = {
  all: ['financial-gaps'] as const,
  list: (params: GapsQueryParams) => [...gapsKeys.all, params] as const,
}

export function useFinancialGaps(params: GapsQueryParams) {
  return useQuery({
    queryKey: gapsKeys.list(params),
    queryFn: () => getFinancialGaps(params),
    enabled: !!params.dateFrom && !!params.dateTo,
    staleTime: 30_000,
    gcTime: 300_000,
    retry: 1,
  })
}

export function useAnalyzeGap() {
  return useMutation({
    mutationFn: (missingDate: string) => analyzeGap(missingDate),
  })
}

export function useRemediateGap(params: GapsQueryParams) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: RemediatePayload) => remediateGap(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: gapsKeys.list(params) }),
  })
}
