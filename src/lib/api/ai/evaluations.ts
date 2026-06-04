/**
 * AI Evaluations API — boundary normalizers + fetchers
 * Endpoints: GET /v1/ai/evaluations, GET /v1/ai/evaluations/sku-accuracy
 * Story 108.1-FE
 */

import { apiClient } from '../../api-client'
import type {
  AiEvaluationListResponse,
  EvaluationEntry,
  SkuAccuracyListResponse,
  SkuAccuracyEntry,
  SkuAccuracyHistoryEntry,
} from '@/types/ai/evaluations'

// ── Evaluation List ──────────────────────────────────────────────────────────

// Raw shape from backend — all fields optional/nullable for defensive normalization.
// 6 new fields shipped with ?modelId= filter (Story 110.2-FE F-1).
interface RawEvaluationEntry {
  forecastId?: string | null
  modelId?: string | null
  nmId?: number | null
  forecastDate?: string | null
  horizonDays?: number | null
  predictedUnits?: number | null
  actualUnits?: number | null
  predictedRevenue?: number | null
  actualRevenue?: number | null
  mapeUnits?: number | null
  mapeRevenue?: number | null
  evaluationDate?: string | null
}

interface RawAiEvaluationListResponse {
  evaluations?: RawEvaluationEntry[] | null
  cabinetMape?: number | null
  evaluatedAt?: string | null
  skuCount?: number | null
}

function normalizeEvaluationEntry(raw: RawEvaluationEntry): EvaluationEntry {
  return {
    forecastId: raw.forecastId ?? '',
    modelId: raw.modelId ?? '',
    nmId: raw.nmId ?? null,
    forecastDate: raw.forecastDate ?? '',
    horizonDays: raw.horizonDays ?? 0,
    predictedUnits: raw.predictedUnits ?? 0,
    actualUnits: raw.actualUnits ?? 0,
    // Epic 113 I1 / anti-pattern #8: money field — preserve NULL (revenue-target absent), never ?? 0.
    predictedRevenue: raw.predictedRevenue ?? null,
    actualRevenue: raw.actualRevenue ?? 0,
    mapeUnits: raw.mapeUnits ?? null,
    mapeRevenue: raw.mapeRevenue ?? null,
    evaluationDate: raw.evaluationDate ?? '',
  }
}

export function normalizeAiEvaluationListResponse(
  raw: RawAiEvaluationListResponse
): AiEvaluationListResponse {
  return {
    evaluations: (raw.evaluations ?? []).map(normalizeEvaluationEntry),
    cabinetMape: raw.cabinetMape ?? null,
    evaluatedAt: raw.evaluatedAt ?? null,
    skuCount: raw.skuCount ?? 0,
  }
}

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
  const raw = await apiClient.get<RawAiEvaluationListResponse>(
    `/v1/ai/evaluations${qs ? `?${qs}` : ''}`
  )
  return normalizeAiEvaluationListResponse(raw)
}

// ── SKU Accuracy ─────────────────────────────────────────────────────────────

interface RawSkuAccuracyHistoryEntry {
  evaluationDate?: string | null
  predictedUnits?: number | null
  actualUnits?: number | null
  /** Naive baseline predicted units — distinct from naiveMape (percentage); AP#8 null preserved (F-1 3rd-pass) */
  naiveBaseline?: number | null
  mapeUnits?: number | null
  naiveMape?: number | null
}

interface RawSkuAccuracyEntry {
  nmId?: number | null
  vendorCode?: string | null
  history?: RawSkuAccuracyHistoryEntry[] | null
  avgAiMape?: number | null
  avgNaiveMape?: number | null
  aiAccuracyPercent?: number | null
  /** Backend field: naiveAccuracyPercent (test-api/99-ai.http:77, Task 2 Story 110.3-FE) */
  naiveAccuracyPercent?: number | null
  /** Backend field: evaluationCount — count, semantic-zero OK (Task 2 Story 110.3-FE) */
  evaluationCount?: number | null
}

interface RawSkuAccuracyListResponse {
  skuAccuracies?: RawSkuAccuracyEntry[] | null
}

function normalizeSkuAccuracyHistoryEntry(
  raw: RawSkuAccuracyHistoryEntry
): SkuAccuracyHistoryEntry {
  return {
    evaluationDate: raw.evaluationDate ?? '',
    predictedUnits: raw.predictedUnits ?? 0,
    actualUnits: raw.actualUnits ?? 0,
    // AP#8: naiveBaseline is a units field (not count) — null preserved, not coerced to 0
    naiveBaseline: raw.naiveBaseline ?? null,
    mapeUnits: raw.mapeUnits ?? null,
    naiveMape: raw.naiveMape ?? null,
  }
}

function normalizeSkuAccuracyEntry(raw: RawSkuAccuracyEntry): SkuAccuracyEntry {
  return {
    // F-1: ?? null (not ?? 0) — null nmId is meaningless for the table and gets filtered by caller
    nmId: raw.nmId ?? null,
    vendorCode: raw.vendorCode ?? null,
    history: (raw.history ?? []).map(normalizeSkuAccuracyHistoryEntry),
    avgAiMape: raw.avgAiMape ?? null,
    avgNaiveMape: raw.avgNaiveMape ?? null,
    aiAccuracyPercent: raw.aiAccuracyPercent ?? null,
    naiveAccuracyPercent: raw.naiveAccuracyPercent ?? null,
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: count field, zero is a valid sentinel
    evaluationCount: raw.evaluationCount ?? 0,
  }
}

export function normalizeSkuAccuracyListResponse(
  raw: RawSkuAccuracyListResponse
): SkuAccuracyListResponse {
  // F-1: filter out entries with null nmId — they are malformed backend rows with no identity.
  // normalizeSkuAccuracyEntry returns nmId: null when raw.nmId is absent; those rows are dropped here.
  const entries = (raw.skuAccuracies ?? [])
    .map(normalizeSkuAccuracyEntry)
    .filter((e): e is SkuAccuracyEntry & { nmId: number } => e.nmId !== null)
  return { skuAccuracies: entries }
}

export interface SkuAccuracyParams {
  /** Model UUID — used ONLY for cabinet+model cache-key scoping (useAiSkuAccuracy). NOT sent as a
   *  query param: the backend whitelist REJECTS an unknown `modelId` with HTTP 400 (see getSkuAccuracy). */
  modelId: string
  /** Filter to a single SKU. The backend ACCEPTS `nmId` (HTTP 200); whether it actually filters is
   *  pending #166. Accepts number | null | undefined; null and undefined both omit the URL param (F-7). */
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
  const raw = await apiClient.get<RawSkuAccuracyListResponse>(
    `/v1/ai/evaluations/sku-accuracy${qs ? `?${qs}` : ''}`
  )
  return normalizeSkuAccuracyListResponse(raw)
}
