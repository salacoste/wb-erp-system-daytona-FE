/**
 * AI Admin boundary normalizer — Story 108.1-FE
 * Endpoint: GET /v1/ai/admin/models
 */

import { toCount } from '../normalizer-helpers'
import { normalizeAiModelListResponse, RawAiModel } from './ai-models-normalizer'
import type { AdminModelListResponse } from '@/types/ai/admin'

interface RawAdminModelListResponse {
  models?: RawAiModel[] | null
  total?: number | null
  page?: number | null
  limit?: number | null
}

export function normalizeAdminModelListResponse(raw: unknown): AdminModelListResponse {
  const r = raw as RawAdminModelListResponse
  // Re-use model normalizer for the models array
  const base = normalizeAiModelListResponse({ models: r.models })
  return {
    models: base.models,
    total: toCount(r.total),
    page: r.page ?? 1,
    limit: r.limit ?? 20,
  }
}
