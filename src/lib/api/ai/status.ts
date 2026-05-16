/**
 * AI Status API — boundary normalizer + fetcher
 * Endpoint: GET /v1/ai/status
 * Story 108.1-FE: Readiness state machine for 3-state UI routing.
 */

import { apiClient } from '../../api-client'
import { isReadinessLevel } from '@/types/ai/status'
import type { AiStatusResponse } from '@/types/ai/status'

interface RawAiStatusResponse {
  readinessLevel?: string | null
  weeksCollected?: number | null
  weeksRequired?: number | null
  progressPct?: number | null
  missingRequirements?: string[] | null
  estimatedActivationDate?: string | null
  cogsCoveragePct?: number | null
  skuCount?: number | null
  orderCount?: number | null
}

export function normalizeAiStatusResponse(raw: RawAiStatusResponse): AiStatusResponse {
  const rawLevel = raw.readinessLevel ?? ''
  // Defensive: unknown readiness level falls back to 'ready' so the page is never blanked
  // (Epic 108 spec mandates 'ready' as the safe fallback — 'collecting' would hide content).
  const readinessLevel = isReadinessLevel(rawLevel) ? rawLevel : 'ready'

  // Defensive: backend does not include weeksRequired in its response contract
  // (see docs/request-backend/174-ai-status-weeks-required-missing.md).
  // Preserve null so the UI can render defensively (no "X из 0" nonsense).
  const weeksRequired = raw.weeksRequired != null ? raw.weeksRequired : null
  if (weeksRequired === null) {
    // Surface missing contract field in DevTools so the backend gap is visible.
    // eslint-disable-next-line no-console
    console.warn('[ai/status] weeksRequired absent from backend response', raw)
  }

  return {
    readinessLevel,
    weeksCollected: raw.weeksCollected ?? 0,
    weeksRequired,
    progressPct: raw.progressPct ?? null,
    missingRequirements: raw.missingRequirements ?? [],
    estimatedActivationDate: raw.estimatedActivationDate ?? null,
    cogsCoveragePct: raw.cogsCoveragePct ?? null,
    skuCount: raw.skuCount ?? 0,
    orderCount: raw.orderCount ?? 0,
  }
}

export async function getAiStatus(): Promise<AiStatusResponse> {
  const raw = await apiClient.get<RawAiStatusResponse>('/v1/ai/status')
  return normalizeAiStatusResponse(raw)
}
