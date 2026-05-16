/**
 * AI Admin types — cross-cabinet model management (Owner role only)
 * Endpoints: GET /v1/ai/admin/models, PATCH /v1/ai/admin/models/:id/rollback
 * Source: docs/AI-FRONTEND-INTEGRATION-GUIDE.md § Admin Endpoints
 */

import type { AiModel } from './models'

export interface AdminModelListParams {
  status?: string
  page?: number
  limit?: number
}

export interface AdminModelListResponse {
  models: AiModel[]
  /** Total model count across all cabinets — count, semantic-zero OK */
  total: number
  page: number
  limit: number
}

export interface ModelRollbackRequest {
  /** Human-readable reason for rollback e.g. "MAPE degraded from 12% to 45%" */
  reason: string
}
