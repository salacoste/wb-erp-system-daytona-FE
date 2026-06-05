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

// ── Anomaly List (Story 112.3-FE) ─────────────────────────────────────────────
// Backend #167 shipped: GET /v1/ai/anomalies with status/severity/anomalyType filters + pagination.

/**
 * Resolution status of an anomaly record.
 * Story 112.3-FE, backend request #167.
 */
export type AnomalyStatus = 'pending' | 'resolved'

/**
 * Single anomaly entry returned by GET /v1/ai/anomalies.
 * Story 112.3-FE, backend request #167.
 * `id` and `nmId` are opaque identifiers — always render as String(id), String(nmId) per AP#10.
 */
export interface AnomalyEntry {
  id: string
  nmId: number
  forecastId?: string
  anomalyType: string
  triggeredAt: string
  status: AnomalyStatus
  cabinetId: string
  modelId?: string
  /** Vendor code (артикул). null when backend has no vendor code for this nmId. */
  vendorCode: string | null
  severity: string
  value: number
  baselineValue: number
  deviationPct: number
  rootCauseHint: string | null
  resolvedAt: string | null
  resolutionCause: string | null
  resolutionNote: string | null
}

/**
 * Paginated response from GET /v1/ai/anomalies.
 * Story 112.3-FE, backend request #167.
 * `total`, `page`, `limit` are semantic counts — AP#8 exception (AGGREGATION-REDUCE / SEMANTIC-ZERO).
 * `status` echoes the filter param applied server-side.
 * UI-only sentinel `'all'` lives in `AnomalyFilter` (anomalies-helpers.ts) per Boundary Normalizer Pattern.
 */
export interface AnomalyListResponse {
  anomalies: AnomalyEntry[]
  total: number
  page: number
  limit: number
  /**
   * Echoed filter status from server (mirrors `params.status` when filter applied).
   * UI-only sentinel `'all'` lives in `AnomalyFilter` in anomalies-helpers.ts — never echoed by server.
   * Server echoes undefined when no filter applied.
   */
  status?: AnomalyStatus
}
