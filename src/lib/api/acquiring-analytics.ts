/**
 * Acquiring Cost Reports — API Client — Epic 90-FE Story 90.1-FE
 *
 * Wraps the 3 backend acquiring endpoints with typed async functions and
 * a TanStack Query key factory.
 *
 * Why skipDataUnwrap: true
 *   The default apiClient auto-unwraps `{ data: ... }` envelopes, stripping
 *   the outer object. Acquiring responses are `{ data: [...], cached_at: "..." }`.
 *   We need BOTH fields (the array AND cached_at for freshness display), so we
 *   disable auto-unwrap and let the normalizer handle the full envelope.
 *   Pattern from src/lib/api/buyout-analytics.ts:41.
 *
 * Endpoints (per test-api/34-acquiring-analytics.http + Request #166 doc-2):
 *   GET /v1/analytics/acquiring/reports?from=&to=
 *   GET /v1/analytics/acquiring/reports/:id/detail
 *   GET /v1/analytics/acquiring/detail?from=&to=
 *
 * @see src/lib/api/acquiring-normalizer.ts
 * @see src/types/acquiring-analytics.ts
 * @see docs/request-backend/166-ACQUIRING-COST-REPORTS-API.md
 */

import { apiClient } from '../api-client'
import { qs } from './query-string'
import type {
  AcquiringListResponse,
  AcquiringDetailResponse,
  AcquiringReportsParams,
  AcquiringReportDetailParams,
  AcquiringPeriodDetailParams,
} from '@/types/acquiring-analytics'
import {
  normalizeAcquiringListResponse,
  normalizeAcquiringDetailResponse,
} from './acquiring-normalizer'

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const acquiringQueryKeys = {
  all: ['acquiring'] as const,
  reports: (params: AcquiringReportsParams) => ['acquiring', 'reports', params] as const,
  reportDetail: (reportId: number) => ['acquiring', 'report-detail', reportId] as const,
  periodDetail: (params: AcquiringPeriodDetailParams) =>
    ['acquiring', 'period-detail', params] as const,
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * GET /v1/analytics/acquiring/reports?from=&to=
 * Returns the list of acquiring reports for the given period.
 */
export async function getAcquiringReports(
  params: AcquiringReportsParams
): Promise<AcquiringListResponse> {
  // Fail-fast: backend returns 400 for missing from/to. Guard here so misuse
  // by future callers produces a clear local error, not a confusing backend 4xx.
  // (Review fix M-2.)
  if (!params.from || !params.to) {
    throw new Error('getAcquiringReports: from and to are required')
  }
  const raw = await apiClient.get<unknown>(
    `/v1/analytics/acquiring/reports${qs({ from: params.from, to: params.to })}`,
    { skipDataUnwrap: true }
  )
  return normalizeAcquiringListResponse(raw)
}

/**
 * GET /v1/analytics/acquiring/reports/:id/detail
 * Returns per-transaction detail for a specific acquiring report.
 */
export async function getAcquiringReportDetail(
  params: AcquiringReportDetailParams
): Promise<AcquiringDetailResponse> {
  const raw = await apiClient.get<unknown>(
    `/v1/analytics/acquiring/reports/${params.reportId}/detail`,
    { skipDataUnwrap: true }
  )
  return normalizeAcquiringDetailResponse(raw)
}

/**
 * GET /v1/analytics/acquiring/detail?from=&to=
 * Returns cross-report per-transaction detail for the given period.
 */
export async function getAcquiringPeriodDetail(
  params: AcquiringPeriodDetailParams
): Promise<AcquiringDetailResponse> {
  // Fail-fast: backend returns 400 for missing from/to. Guard here so misuse
  // by future callers produces a clear local error, not a confusing backend 4xx.
  // (Review fix M-2.)
  if (!params.from || !params.to) {
    throw new Error('getAcquiringPeriodDetail: from and to are required')
  }
  const raw = await apiClient.get<unknown>(
    `/v1/analytics/acquiring/detail${qs({ from: params.from, to: params.to })}`,
    { skipDataUnwrap: true }
  )
  return normalizeAcquiringDetailResponse(raw)
}
