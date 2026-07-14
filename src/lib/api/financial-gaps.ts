/**
 * Financial Gaps API Client
 * GET/POST /v1/imports/gaps/* endpoints
 */

import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/authStore'
import type {
  FinancialGapsResponse,
  GapAnalysisResponse,
  GapRemediationResponse,
  GapsQueryParams,
  RemediatePayload,
} from '@/types/financial-gaps'

/** GET /v1/imports/gaps?dateFrom=...&dateTo=...
 *  Cabinet is sent via the X-Cabinet-Id header (auto-injected by apiClient) — BE-E-2
 *  live-re-validated 2026-07-11: the header is accepted, no `cabinet_id` query param needed. */
export async function getFinancialGaps(params: GapsQueryParams): Promise<FinancialGapsResponse> {
  const query = new URLSearchParams({
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  })
  return apiClient.get<FinancialGapsResponse>(`/v1/imports/gaps?${query.toString()}`)
}

/** POST /v1/imports/gaps/analyze */
export async function analyzeGap(missingDate: string): Promise<GapAnalysisResponse> {
  const cabinetId = useAuthStore.getState().cabinetId
  return apiClient.post<GapAnalysisResponse>('/v1/imports/gaps/analyze', {
    cabinet_id: cabinetId,
    missing_date: missingDate,
  })
}

/** POST /v1/imports/gaps/remediate */
export async function remediateGap(payload: RemediatePayload): Promise<GapRemediationResponse> {
  const cabinetId = useAuthStore.getState().cabinetId
  return apiClient.post<GapRemediationResponse>('/v1/imports/gaps/remediate', {
    ...payload,
    cabinet_id: cabinetId,
  })
}
