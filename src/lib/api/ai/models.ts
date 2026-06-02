/**
 * AI Model Management API — boundary normalizers + fetchers
 * Endpoints: GET /v1/ai/models, POST /v1/ai/models/train,
 *            GET /v1/ai/models/:id/performance
 * Story 108.1-FE
 */

import { apiClient } from '../../api-client'
import type {
  AiModel,
  AiModelListResponse,
  AiModelMetrics,
  ModelStatus,
  ModelTrainRequest,
  ModelTrainResponse,
  ModelPerformanceResponse,
  MapeTrendEntry,
  DriftStatus,
} from '@/types/ai/models'
import type { ModelType } from '@/types/ai/forecast'

// ── Model List ───────────────────────────────────────────────────────────────

interface RawAiModelMetrics {
  mape?: number | null
  dataPointsCount?: number | null
}

export interface RawAiModel {
  id?: string | null
  modelType?: string | null
  engine?: string | null
  version?: number | null
  status?: string | null
  metrics?: RawAiModelMetrics | null
  trainingDataRange?: { from: string; to: string } | null
  trainedAt?: string | null
}

function normalizeModelMetrics(raw: RawAiModelMetrics | null | undefined): AiModelMetrics {
  return {
    mape: raw?.mape ?? null,
    dataPointsCount: raw?.dataPointsCount ?? 0,
  }
}

// F-39: validate status at the boundary — an unknown status (backend adds a new one
// before the FE ships) would otherwise pass the `as` cast and crash STATUS_BADGE_CONFIG[status]
// (undefined.className). Unknown → 'retired' (a safe, badge-mapped fallback).
const VALID_MODEL_STATUSES = new Set<ModelStatus>([
  'active',
  'training',
  'degraded',
  'retired',
  'rolled_back',
  'failed',
  'deprecated',
])

function normalizeAiModel(raw: RawAiModel): AiModel {
  return {
    id: raw.id ?? '',
    modelType: (raw.modelType ?? 'sales_forecast') as ModelType,
    engine: (raw.engine ?? 'prophet') as AiModel['engine'],
    version: raw.version ?? 0,
    status: VALID_MODEL_STATUSES.has(raw.status as ModelStatus)
      ? (raw.status as ModelStatus)
      : 'retired',
    metrics: normalizeModelMetrics(raw.metrics),
    trainingDataRange: raw.trainingDataRange ?? undefined,
    trainedAt: raw.trainedAt ?? undefined,
  }
}

interface RawAiModelListResponse {
  models?: RawAiModel[] | null
}

/**
 * Validation F-39: GET /v1/ai/models returns a BARE array of models (not a
 * { models: [...] } wrapper), and apiClient passes it through (no `data` key). The old
 * `raw.models ?? []` read `.models` on that array → undefined → [] → the /analytics/models
 * list + model [id]/evaluations + [id]/performance pages were permanently empty / "model
 * not found". Accept both the bare array (prod) and the wrapper (defensive).
 */
export function normalizeAiModelListResponse(
  raw: RawAiModelListResponse | RawAiModel[] | null | undefined
): AiModelListResponse {
  const models = Array.isArray(raw) ? raw : (raw?.models ?? [])
  return {
    models: models.map(normalizeAiModel),
  }
}

export async function getAiModels(): Promise<AiModelListResponse> {
  const raw = await apiClient.get<RawAiModel[]>('/v1/ai/models')
  return normalizeAiModelListResponse(raw)
}

// ── Model Train ──────────────────────────────────────────────────────────────

export async function postModelTrain(body: ModelTrainRequest): Promise<ModelTrainResponse> {
  const raw = await apiClient.post<{ status: string; modelType: string; message?: string }>(
    '/v1/ai/models/train',
    body
  )
  return {
    status: (raw.status ?? 'queued') as ModelTrainResponse['status'],
    modelType: (raw.modelType ?? body.modelType) as ModelType,
    message: raw.message,
  }
}

// ── Model Performance ────────────────────────────────────────────────────────

interface RawMapeTrendEntry {
  evaluationDate?: string | null
  cabinetMape?: number | null
  skuCount?: number | null
}

interface RawModelPerformanceResponse {
  driftStatus?: string | null
  previousVersionMetrics?: RawAiModelMetrics | null
  mapeTrend?: RawMapeTrendEntry[] | null
}

function normalizeMapeTrendEntry(raw: RawMapeTrendEntry): MapeTrendEntry {
  return {
    evaluationDate: raw.evaluationDate ?? '',
    cabinetMape: raw.cabinetMape ?? null,
    skuCount: raw.skuCount ?? 0,
  }
}

const DRIFT_STATUSES = new Set<DriftStatus>(['improving', 'stable', 'degrading'])

export function normalizeModelPerformanceResponse(
  raw: RawModelPerformanceResponse
): ModelPerformanceResponse {
  const rawDrift = raw.driftStatus ?? ''
  const driftStatus: DriftStatus | null = DRIFT_STATUSES.has(rawDrift as DriftStatus)
    ? (rawDrift as DriftStatus)
    : null

  return {
    driftStatus,
    previousVersionMetrics: raw.previousVersionMetrics
      ? normalizeModelMetrics(raw.previousVersionMetrics)
      : undefined,
    mapeTrend: (raw.mapeTrend ?? []).map(normalizeMapeTrendEntry),
  }
}

export async function getModelPerformance(id: string): Promise<ModelPerformanceResponse> {
  const raw = await apiClient.get<RawModelPerformanceResponse>(`/v1/ai/models/${id}/performance`)
  return normalizeModelPerformanceResponse(raw)
}
