/**
 * Preliminary Tax Hook
 * Request #159: Preliminary tax for incomplete weeks
 *
 * Fetches estimated tax data when weekly finance report is not yet available.
 * Returns TaxMetrics | null directly for simple consumption.
 */

import { useQuery } from '@tanstack/react-query'
import { getPreliminaryTax, preliminaryTaxQueryKeys } from '@/lib/api/tax-analytics'
import type { TaxMetrics } from '@/types/finance-summary'

export function usePreliminaryTax(params: {
  from: string
  to: string
  enabled?: boolean
}): TaxMetrics | null {
  const { from, to, enabled = true } = params

  const { data } = useQuery({
    queryKey: preliminaryTaxQueryKeys.byRange(from, to),
    queryFn: () => getPreliminaryTax(from, to),
    enabled: enabled && !!from && !!to,
    staleTime: 60_000,
    retry: 1,
  })

  return data?.tax ?? null
}
