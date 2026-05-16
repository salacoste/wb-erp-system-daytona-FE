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
