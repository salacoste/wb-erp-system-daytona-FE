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
 * Backend request #167.
 * Story 112.3-FE.
 */
export async function getAnomalies(params?: GetAnomaliesParams): Promise<AnomalyListResponse> {
  const sp = new URLSearchParams()
  if (params?.status) sp.set('status', params.status)
  if (params?.limit) sp.set('limit', String(params.limit))
  if (params?.page && params.page > 1) {
    const limit = params.limit ?? 20
    sp.set('offset', String((params.page - 1) * limit))
  }
  const qs = sp.toString()
  const endpoint = `/v1/ai/anomalies${qs ? `?${qs}` : ''}`

  const raw = await apiClient.get<{
    items: Array<{
      id: string
      nmId: number | null
      vendorCode: string | null
      anomalyType: string
      severity: string
      value: number
      baselineValue: number
      deviationPct: number
      rootCauseHint: string | null
      status: string
      detectedAt: string
      resolvedAt: string | null
      resolutionCause: string | null
      resolutionNote: string | null
    }>
    total: number
    limit: number
    offset: number
  }>(endpoint)

  const page = Math.floor(raw.offset / raw.limit) + 1

  return {
    anomalies: raw.items.map(item => ({
      id: item.id,
      nmId: item.nmId ?? 0,
      anomalyType: item.anomalyType,
      triggeredAt: item.detectedAt,
      status: (item.status === 'resolved' ? 'resolved' : 'pending') as AnomalyStatus,
      cabinetId: '',
      vendorCode: item.vendorCode,
      severity: item.severity,
      value: item.value,
      baselineValue: item.baselineValue,
      deviationPct: item.deviationPct,
      rootCauseHint: item.rootCauseHint,
      resolvedAt: item.resolvedAt,
      resolutionCause: item.resolutionCause,
      resolutionNote: item.resolutionNote,
    })),
    total: raw.total,
    page,
    limit: raw.limit,
    status: params?.status,
  }
}
