/**
 * AI System API — Health, Preferences, Feedback, Anomaly Resolution
 * Endpoints: GET /v1/ai/health, GET|PATCH /v1/ai/preferences,
 *            POST /v1/ai/feedback, PATCH /v1/ai/anomalies/:id/resolve
 * Story 108.1-FE
 */

import { apiClient } from '../../api-client'
import type {
  AiHealthResponse,
  AiPreferences,
  AiFeedbackRequest,
  AnomalyResolveRequest,
  AnomalyStatus,
  AnomalyListResponse,
} from '@/types/ai/system'

// ── Health ───────────────────────────────────────────────────────────────────

interface RawAiHealthResponse {
  status?: string | null
  engineConnected?: boolean | null
  engine?: string | null
  latencyMs?: number | null
  cachedPredictionsAvailable?: boolean | null
}

export function normalizeAiHealthResponse(raw: RawAiHealthResponse): AiHealthResponse {
  return {
    status: (raw.status === 'degraded' ? 'degraded' : 'ok') as AiHealthResponse['status'],
    engineConnected: raw.engineConnected ?? false,
    engine: (raw.engine ?? 'prophet') as AiHealthResponse['engine'],
    latencyMs: raw.latencyMs ?? 0,
    cachedPredictionsAvailable: raw.cachedPredictionsAvailable ?? false,
  }
}

export async function getAiHealth(): Promise<AiHealthResponse> {
  const raw = await apiClient.get<RawAiHealthResponse>('/v1/ai/health')
  return normalizeAiHealthResponse(raw)
}

// ── Preferences ───────────────────────────────────────────────────────────────

interface RawAiPreferences {
  aiEnabled?: boolean | null
}

export function normalizeAiPreferences(raw: RawAiPreferences): AiPreferences {
  return {
    aiEnabled: raw.aiEnabled ?? false,
  }
}

export async function getAiPreferences(): Promise<AiPreferences> {
  const raw = await apiClient.get<RawAiPreferences>('/v1/ai/preferences')
  return normalizeAiPreferences(raw)
}

export async function patchAiPreferences(body: Partial<AiPreferences>): Promise<AiPreferences> {
  const raw = await apiClient.patch<RawAiPreferences>('/v1/ai/preferences', body)
  return normalizeAiPreferences(raw)
}

// ── Feedback ─────────────────────────────────────────────────────────────────

export async function postFeedback(body: AiFeedbackRequest): Promise<void> {
  await apiClient.post('/v1/ai/feedback', body)
}

// ── Anomaly Resolution ────────────────────────────────────────────────────────

export async function patchAnomalyResolve(id: string, body: AnomalyResolveRequest): Promise<void> {
  await apiClient.patch(`/v1/ai/anomalies/${id}/resolve`, body)
}

// ── Anomaly List (Story 112.3-FE) ─────────────────────────────────────────────

export interface GetAnomaliesParams {
  status?: AnomalyStatus
  page?: number
  limit?: number
}

/**
 * GET /v1/ai/anomalies — paginated anomaly list.
 * PENDING BACKEND: #167 — currently returns empty stub until endpoint ships.
 * Stub echoes pagination params so future tests can validate page/limit handling.
 * When backend lands: replace body with apiClient.get('/v1/ai/anomalies', { params }) call.
 * Story 112.3-FE.
 */
export async function getAnomalies(params?: GetAnomaliesParams): Promise<AnomalyListResponse> {
  // PENDING BACKEND: #167 — replace with real API call when GET /v1/ai/anomalies ships.
  return {
    anomalies: [],
    total: 0,
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
    status: params?.status, // echo for future test parity; backend will confirm server-side filtering
  }
}
