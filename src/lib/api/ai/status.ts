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
  // Defensive: unknown readiness level falls back to 'collecting' (Story 108.3-FE guard)
  const readinessLevel = isReadinessLevel(rawLevel) ? rawLevel : 'collecting'

  return {
    readinessLevel,
    weeksCollected: raw.weeksCollected ?? 0,
    weeksRequired: raw.weeksRequired ?? 0,
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
