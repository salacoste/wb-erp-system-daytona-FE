/**
 * AI Model Management types — frontend-canonical shapes
 * Endpoints: GET /v1/ai/models, POST /v1/ai/models/train,
 *            GET /v1/ai/models/:id/performance
 * Source: docs/AI-FRONTEND-INTEGRATION-GUIDE.md § Model Management Section
 */

import type { ModelType } from './forecast'

export type ModelEngine = 'prophet' | 'mindsdb'

// F-10: 'rolled_back' and 'failed' added — present in admin API responses and
// required for rollback-blocked-status logic in AdminModelsTable.
// F-39: 'deprecated' added — GET /v1/ai/models returns it live; without it the
// STATUS_BADGE_CONFIG lookup was undefined → TypeError crash on the model list.
export type ModelStatus =
  | 'active'
  | 'training'
  | 'degraded'
  | 'retired'
  | 'rolled_back'
  | 'failed'
  | 'deprecated'

/**
 * Drift direction for model performance over time.
 * null when insufficient evaluation history.
 */
export type DriftStatus = 'improving' | 'stable' | 'degrading'

export interface AiModelMetrics {
  /** Mean Absolute Percentage Error — lower is better, null when not yet evaluated */
  mape: number | null
  /** Number of data points used in training — count, semantic-zero OK */
  dataPointsCount: number
}

export interface AiModel {
  id: string
  modelType: ModelType
  engine: ModelEngine
  /** Model version number — count, semantic-zero OK (v0 = initial) */
  version: number
  status: ModelStatus
  metrics: AiModelMetrics
  trainingDataRange?: { from: string; to: string }
  trainedAt?: string
}

export interface AiModelListResponse {
  models: AiModel[]
}

export interface ModelTrainRequest {
  modelType: ModelType
}

export type ModelTrainStatus = 'queued' | 'duplicate'

export interface ModelTrainResponse {
  status: ModelTrainStatus
  modelType: ModelType
  message?: string
}

export interface MapeTrendEntry {
  evaluationDate: string
  /** Cabinet-level MAPE for this evaluation — ratio, null when not evaluated */
  cabinetMape: number | null
  /** Number of SKUs included — count, semantic-zero OK */
  skuCount: number
}

export interface ModelPerformanceResponse {
  /** null when insufficient evaluation history to determine direction */
  driftStatus: DriftStatus | null
  previousVersionMetrics?: AiModelMetrics
  /** Historical MAPE values for chart rendering — ordered ascending by date */
  mapeTrend: MapeTrendEntry[]
}
