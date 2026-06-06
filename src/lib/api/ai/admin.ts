/**
 * AI Admin API — cross-cabinet model management (Owner role only)
 * Endpoints: GET /v1/ai/admin/models, PATCH /v1/ai/admin/models/:id/rollback
 * Story 108.1-FE
 */

import { apiClient } from '../../api-client'
import { normalizeAdminModelListResponse } from './ai-admin-normalizer'
import type {
  AdminModelListParams,
  AdminModelListResponse,
  ModelRollbackRequest,
} from '@/types/ai/admin'

export { normalizeAdminModelListResponse } from './ai-admin-normalizer'

export async function getAdminModels(
  params?: AdminModelListParams
): Promise<AdminModelListResponse> {
  const queryParams = new URLSearchParams()
  if (params?.status) queryParams.set('status', params.status)
  if (params?.page != null) queryParams.set('page', String(params.page))
  if (params?.limit != null) queryParams.set('limit', String(params.limit))
  const qs = queryParams.toString()
  const raw = await apiClient.get<unknown>(`/v1/ai/admin/models${qs ? `?${qs}` : ''}`)
  return normalizeAdminModelListResponse(raw)
}

export async function patchModelRollback(id: string, body: ModelRollbackRequest): Promise<void> {
  await apiClient.patch(`/v1/ai/admin/models/${id}/rollback`, body)
}
