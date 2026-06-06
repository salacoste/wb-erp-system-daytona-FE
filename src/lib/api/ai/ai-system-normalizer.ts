/**
 * AI System boundary normalizer — Story 108.1-FE
 * Endpoints: GET /v1/ai/health, GET|PATCH /v1/ai/preferences
 */

import type { AiHealthResponse, AiPreferences } from '@/types/ai/system'

// ── Health ───────────────────────────────────────────────────────────────────

interface RawAiHealthResponse {
  status?: string | null
  engineConnected?: boolean | null
  engine?: string | null
  latencyMs?: number | null
  cachedPredictionsAvailable?: boolean | null
}

export function normalizeAiHealthResponse(raw: unknown): AiHealthResponse {
  const r = raw as RawAiHealthResponse
  return {
    status: (r.status === 'degraded' ? 'degraded' : 'ok') as AiHealthResponse['status'],
    engineConnected: r.engineConnected ?? false,
    engine: (r.engine ?? 'prophet') as AiHealthResponse['engine'],
    latencyMs: r.latencyMs ?? 0,
    cachedPredictionsAvailable: r.cachedPredictionsAvailable ?? false,
  }
}

// ── Preferences ───────────────────────────────────────────────────────────────

interface RawAiPreferences {
  aiEnabled?: boolean | null
}

export function normalizeAiPreferences(raw: unknown): AiPreferences {
  const r = raw as RawAiPreferences
  return {
    aiEnabled: r.aiEnabled ?? false,
  }
}
