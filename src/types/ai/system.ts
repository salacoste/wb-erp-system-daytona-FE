/**
 * AI System types — Health, Preferences, Feedback, Anomaly Resolution
 * Endpoints: GET /v1/ai/health, GET|PATCH /v1/ai/preferences,
 *            POST /v1/ai/feedback, PATCH /v1/ai/anomalies/:id/resolve
 * Source: docs/AI-FRONTEND-INTEGRATION-GUIDE.md § System Endpoints
 */

import type { ModelEngine } from './models'

export type AiEngineStatus = 'ok' | 'degraded'

export interface AiHealthResponse {
  status: AiEngineStatus
  engineConnected: boolean
  engine: ModelEngine
  /** Round-trip latency in milliseconds — count, semantic-zero OK */
  latencyMs: number
  /** Whether cached predictions are available during engine outage */
  cachedPredictionsAvailable: boolean
}

export interface AiPreferences {
  /** Master on/off switch — when false, all forecast endpoints return empty */
  aiEnabled: boolean
}

export type FeedbackType = 'thumbs_up' | 'thumbs_down'

export interface AiFeedbackRequest {
  /** UUID from predictions[].forecastId — may be undefined for cached results */
  forecastId: string
  feedbackType: FeedbackType
  /** Optional free-text comment */
  comment?: string
}

/**
 * Root causes for anomaly resolution — Owner/Manager only.
 * Source: docs/AI-FRONTEND-INTEGRATION-GUIDE.md § Resolve anomalies
 */
export type ResolutionCause =
  | 'seasonal'
  | 'pricing_error'
  | 'quality_issue'
  | 'tariff_change'
  | 'category_reclassification'
  | 'other'

export interface AnomalyResolveRequest {
  resolutionCause: ResolutionCause
  /** Optional free-text explanation */
  resolutionNote?: string
}
