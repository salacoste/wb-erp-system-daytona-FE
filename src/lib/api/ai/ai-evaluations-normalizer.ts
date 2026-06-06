/**
 * AI Evaluations boundary normalizer — Story 108.1-FE
 * Endpoints: GET /v1/ai/evaluations, GET /v1/ai/evaluations/sku-accuracy
 */

import { toCount, toNullableNumber } from '../normalizer-helpers'
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
    // Epic 113 I1 / anti-pattern #8: money field — preserve NULL, never ?? 0.
    predictedRevenue: toNullableNumber(raw.predictedRevenue),
    actualRevenue: raw.actualRevenue ?? 0,
    mapeUnits: toNullableNumber(raw.mapeUnits),
    mapeRevenue: toNullableNumber(raw.mapeRevenue),
    evaluationDate: raw.evaluationDate ?? '',
  }
}

export function normalizeAiEvaluationListResponse(raw: unknown): AiEvaluationListResponse {
  const r = raw as RawAiEvaluationListResponse
  return {
    evaluations: (r.evaluations ?? []).map(normalizeEvaluationEntry),
    cabinetMape: toNullableNumber(r.cabinetMape),
    evaluatedAt: r.evaluatedAt ?? null,
    skuCount: toCount(r.skuCount),
  }
}

// ── SKU Accuracy ─────────────────────────────────────────────────────────────

interface RawSkuAccuracyHistoryEntry {
  evaluationDate?: string | null
  predictedUnits?: number | null
  actualUnits?: number | null
  /** Naive baseline predicted units — distinct from naiveMape (percentage); AP#8 null preserved */
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
    naiveBaseline: toNullableNumber(raw.naiveBaseline),
    mapeUnits: toNullableNumber(raw.mapeUnits),
    naiveMape: toNullableNumber(raw.naiveMape),
  }
}

function normalizeSkuAccuracyEntry(raw: RawSkuAccuracyEntry): SkuAccuracyEntry {
  return {
    // F-1: ?? null (not ?? 0) — null nmId is meaningless for the table and gets filtered by caller
    nmId: raw.nmId ?? null,
    vendorCode: raw.vendorCode ?? null,
    history: (raw.history ?? []).map(normalizeSkuAccuracyHistoryEntry),
    avgAiMape: toNullableNumber(raw.avgAiMape),
    avgNaiveMape: toNullableNumber(raw.avgNaiveMape),
    aiAccuracyPercent: toNullableNumber(raw.aiAccuracyPercent),
    naiveAccuracyPercent: toNullableNumber(raw.naiveAccuracyPercent),
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: count field, zero is a valid sentinel
    evaluationCount: raw.evaluationCount ?? 0,
  }
}

export function normalizeSkuAccuracyListResponse(raw: unknown): SkuAccuracyListResponse {
  const r = raw as RawSkuAccuracyListResponse
  // F-1: filter out entries with null nmId — they are malformed backend rows with no identity.
  const entries = (r.skuAccuracies ?? [])
    .map(normalizeSkuAccuracyEntry)
    .filter((e): e is SkuAccuracyEntry & { nmId: number } => e.nmId !== null)
  return { skuAccuracies: entries }
}
