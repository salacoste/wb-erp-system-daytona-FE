/**
 * AI System API — Health, Preferences, Feedback, Anomaly Resolution
 * Endpoints: GET /v1/ai/health, GET|PATCH /v1/ai/preferences,
 *            POST /v1/ai/feedback, PATCH /v1/ai/anomalies/:id/resolve
 *            GET /v1/ai/anomalies
 * Story 108.1-FE
 */

import { apiClient } from '../../api-client'
import { asRecord, toCount } from '../normalizer-helpers'
import { normalizeAiHealthResponse, normalizeAiPreferences } from './ai-system-normalizer'
import type {
  AiHealthResponse,
  AiPreferences,
  AiFeedbackRequest,
  AnomalyResolveRequest,
  AnomalyStatus,
  AnomalyListResponse,
} from '@/types/ai/system'

export { normalizeAiHealthResponse, normalizeAiPreferences } from './ai-system-normalizer'

// ── Health ───────────────────────────────────────────────────────────────────

export async function getAiHealth(): Promise<AiHealthResponse> {
  const raw = await apiClient.get<unknown>('/v1/ai/health')
  return normalizeAiHealthResponse(raw)
}

// ── Preferences ───────────────────────────────────────────────────────────────

export async function getAiPreferences(): Promise<AiPreferences> {
  const raw = await apiClient.get<unknown>('/v1/ai/preferences')
  return normalizeAiPreferences(raw)
}

export async function patchAiPreferences(body: Partial<AiPreferences>): Promise<AiPreferences> {
  const raw = await apiClient.patch<unknown>('/v1/ai/preferences', body)
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

  const raw = await apiClient.get<unknown>(endpoint)
  const rec = asRecord(raw)
  const rawItems = Array.isArray(rec.items) ? rec.items : []
  const rawLimit = toCount(rec.limit) || 20
  const rawOffset = toCount(rec.offset)
  const page = Math.floor(rawOffset / rawLimit) + 1

  return {
    anomalies: rawItems.map((item: unknown) => {
      const r = asRecord(item)
      return {
        id: String(r.id ?? ''),
        nmId: toCount(r.nmId),
        anomalyType: String(r.anomalyType ?? ''),
        triggeredAt: String(r.detectedAt ?? ''),
        status: (r.status === 'resolved' ? 'resolved' : 'pending') as AnomalyStatus,
        cabinetId: '',
        vendorCode: typeof r.vendorCode === 'string' ? r.vendorCode : null,
        severity: String(r.severity ?? ''),
        value: Number(r.value ?? 0),
        baselineValue: Number(r.baselineValue ?? 0),
        deviationPct: Number(r.deviationPct ?? 0),
        rootCauseHint: typeof r.rootCauseHint === 'string' ? r.rootCauseHint : null,
        resolvedAt: typeof r.resolvedAt === 'string' ? r.resolvedAt : null,
        resolutionCause: typeof r.resolutionCause === 'string' ? r.resolutionCause : null,
        resolutionNote: typeof r.resolutionNote === 'string' ? r.resolutionNote : null,
      }
    }),
    total: toCount(rec.total),
    page,
    limit: rawLimit,
    status: params?.status,
  }
}
