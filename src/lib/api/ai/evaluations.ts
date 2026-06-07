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
  /** Model UUID — sent as ?modelId= filter (Request #166 RESOLVED: backend now accepts + filters by it). */
  modelId: string
  /** Filter to a single SKU. Accepts number | null | undefined; null and undefined both omit the URL param (F-7). */
  nmId?: number | null
  format?: 'json' | 'csv'
}

export async function getSkuAccuracy(params: SkuAccuracyParams): Promise<SkuAccuracyListResponse> {
  const queryParams = new URLSearchParams()
  // Request #166 RESOLVED (2026-06-06): backend now accepts modelId + nmId filter params.
  queryParams.set('modelId', params.modelId)
  // F-7: treat null and undefined identically — both omit the nmId URL param
  if (params.nmId != null) queryParams.set('nmId', String(params.nmId))
  if (params.format) queryParams.set('format', params.format)
  const qs = queryParams.toString()
  const raw = await apiClient.get<unknown>(`/v1/ai/evaluations/sku-accuracy${qs ? `?${qs}` : ''}`)
  return normalizeSkuAccuracyListResponse(raw)
}
