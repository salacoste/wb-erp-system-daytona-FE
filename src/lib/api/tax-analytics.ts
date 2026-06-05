/**
 * Tax Analytics API
 * Request #159: Preliminary tax calculation for incomplete weeks
 *
 * Fetches estimated tax when no weekly finance report is available yet.
 * Uses daily data (orders, advertising, COGS, storage) for estimation.
 */

import { apiClient } from '@/lib/api-client'
import { normalizePreliminaryTaxResponse } from './tax-analytics-normalizer'
import type { TaxMetrics } from '@/types/finance-summary'

export interface PreliminaryTaxResponse {
  tax: TaxMetrics | null
}

export const preliminaryTaxQueryKeys = {
  all: ['tax', 'preliminary'] as const,
  byRange: (from: string, to: string) => [...preliminaryTaxQueryKeys.all, from, to] as const,
}

export async function getPreliminaryTax(from: string, to: string): Promise<PreliminaryTaxResponse> {
  const raw = await apiClient.get<unknown>(`/v1/analytics/tax/preliminary?from=${from}&to=${to}`)
  return normalizePreliminaryTaxResponse(raw)
}
