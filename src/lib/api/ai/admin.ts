/**
 * AI Admin API — cross-cabinet model management (Owner role only)
 * Endpoints: GET /v1/ai/admin/models, PATCH /v1/ai/admin/models/:id/rollback
 * Story 108.1-FE
 */

import { apiClient } from '../../api-client'
import type {
  AdminModelListParams,
  AdminModelListResponse,
  ModelRollbackRequest,
} from '@/types/ai/admin'
import { normalizeAiModelListResponse, RawAiModel } from './models'

interface RawAdminModelListResponse {
  models?: RawAiModel[] | null
  total?: number | null
  page?: number | null
  limit?: number | null
}

export function normalizeAdminModelListResponse(
  raw: RawAdminModelListResponse
): AdminModelListResponse {
  // Re-use model normalizer for the models array
  const base = normalizeAiModelListResponse({ models: raw.models })
  return {
    models: base.models,
    total: raw.total ?? 0,
    page: raw.page ?? 1,
    limit: raw.limit ?? 20,
  }
}

export async function getAdminModels(
  params?: AdminModelListParams
): Promise<AdminModelListResponse> {
  const queryParams = new URLSearchParams()
  if (params?.status) queryParams.set('status', params.status)
  if (params?.page != null) queryParams.set('page', String(params.page))
  if (params?.limit != null) queryParams.set('limit', String(params.limit))
  const qs = queryParams.toString()
  const raw = await apiClient.get<RawAdminModelListResponse>(
    `/v1/ai/admin/models${qs ? `?${qs}` : ''}`
  )
  return normalizeAdminModelListResponse(raw)
}

export async function patchModelRollback(id: string, body: ModelRollbackRequest): Promise<void> {
  await apiClient.patch(`/v1/ai/admin/models/${id}/rollback`, body)
}
