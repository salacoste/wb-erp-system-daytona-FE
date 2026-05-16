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

interface RawEvaluationEntry {
  forecastId?: string | null
  nmId?: number | null
  predictedUnits?: number | null
  actualUnits?: number | null
  mapeUnits?: number | null
  mapeRevenue?: number | null
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
    nmId: raw.nmId ?? null,
    predictedUnits: raw.predictedUnits ?? 0,
    actualUnits: raw.actualUnits ?? 0,
    mapeUnits: raw.mapeUnits ?? null,
    mapeRevenue: raw.mapeRevenue ?? null,
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
  from?: string
  to?: string
}

export async function getEvaluations(params?: EvaluationParams): Promise<AiEvaluationListResponse> {
  const queryParams = new URLSearchParams()
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
    mapeUnits: raw.mapeUnits ?? null,
    naiveMape: raw.naiveMape ?? null,
  }
}

function normalizeSkuAccuracyEntry(raw: RawSkuAccuracyEntry): SkuAccuracyEntry {
  return {
    nmId: raw.nmId ?? 0,
    vendorCode: raw.vendorCode ?? null,
    history: (raw.history ?? []).map(normalizeSkuAccuracyHistoryEntry),
    avgAiMape: raw.avgAiMape ?? null,
    avgNaiveMape: raw.avgNaiveMape ?? null,
    aiAccuracyPercent: raw.aiAccuracyPercent ?? null,
  }
}

export function normalizeSkuAccuracyListResponse(
  raw: RawSkuAccuracyListResponse
): SkuAccuracyListResponse {
  return {
    skuAccuracies: (raw.skuAccuracies ?? []).map(normalizeSkuAccuracyEntry),
  }
}

export async function getSkuAccuracy(format?: 'json' | 'csv'): Promise<SkuAccuracyListResponse> {
  const qs = format ? `?format=${format}` : ''
  const raw = await apiClient.get<RawSkuAccuracyListResponse>(
    `/v1/ai/evaluations/sku-accuracy${qs}`
  )
  return normalizeSkuAccuracyListResponse(raw)
}
