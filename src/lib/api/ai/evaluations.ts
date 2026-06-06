/**
 * AI Evaluations API — fetchers
 * Endpoints: GET /v1/ai/evaluations, GET /v1/ai/evaluations/sku-accuracy
 * Story 108.1-FE
 */

import { apiClient } from '../../api-client'
import {
  normalizeAiEvaluationListResponse,
  normalizeSkuAccuracyListResponse,
} from './ai-evaluations-normalizer'
import type { AiEvaluationListResponse, SkuAccuracyListResponse } from '@/types/ai/evaluations'

export {
  normalizeAiEvaluationListResponse,
  normalizeSkuAccuracyListResponse,
} from './ai-evaluations-normalizer'

// ── Evaluation List ──────────────────────────────────────────────────────────

export interface EvaluationParams {
  /** Filter by model UUID — backend ships ?modelId= filter (Story 110.2-FE F-1) */
  modelId?: string
  from?: string
  to?: string
}

export async function getEvaluations(params?: EvaluationParams): Promise<AiEvaluationListResponse> {
  const queryParams = new URLSearchParams()
  if (params?.modelId) queryParams.set('modelId', params.modelId)
  if (params?.from) queryParams.set('from', params.from)
  if (params?.to) queryParams.set('to', params.to)
  const qs = queryParams.toString()
  const raw = await apiClient.get<unknown>(`/v1/ai/evaluations${qs ? `?${qs}` : ''}`)
  return normalizeAiEvaluationListResponse(raw)
}

// ── SKU Accuracy ─────────────────────────────────────────────────────────────

export interface SkuAccuracyParams {
  /** Model UUID — used ONLY for cabinet+model cache-key scoping (useAiSkuAccuracy). NOT sent as a
   *  query param: the backend whitelist REJECTS an unknown `modelId` with HTTP 400 (see getSkuAccuracy). */
  modelId: string
  /** Filter to a single SKU. Accepts number | null | undefined; null and undefined both omit the URL param (F-7). */
  nmId?: number | null
  format?: 'json' | 'csv'
}

// iter-63: the backend whitelist (forbidNonWhitelisted) REJECTS an unknown `modelId` query param with
// HTTP 400 ("modelId should not exist") — it does NOT silently ignore it as the prior comment claimed.
// Sending modelId broke the page entirely (permanent error state). Until #166 ships server-side
// model-scoping we MUST omit modelId; the response is cabinet-wide (all models), which is the
// page's already-documented interim behavior. `nmId` IS whitelisted (HTTP 200) so it is still sent.
// PENDING BACKEND: #166 — re-add `modelId` to the query once the backend accepts + filters by it.
// See docs/request-backend/166-ai-sku-accuracy-modelid-nmid-filter.md
export async function getSkuAccuracy(params: SkuAccuracyParams): Promise<SkuAccuracyListResponse> {
  const queryParams = new URLSearchParams()
  // F-7: treat null and undefined identically — both omit the nmId URL param
  if (params.nmId != null) queryParams.set('nmId', String(params.nmId))
  if (params.format) queryParams.set('format', params.format)
  const qs = queryParams.toString()
  const raw = await apiClient.get<unknown>(`/v1/ai/evaluations/sku-accuracy${qs ? `?${qs}` : ''}`)
  return normalizeSkuAccuracyListResponse(raw)
}
