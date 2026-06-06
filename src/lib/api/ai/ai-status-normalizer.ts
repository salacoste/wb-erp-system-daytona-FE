/**
 * AI Status boundary normalizer — Story 108.1-FE
 * Endpoint: GET /v1/ai/status
 * Readiness state machine for 3-state UI routing.
 */

import { toCount, toNullableNumber } from '../normalizer-helpers'
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

export function normalizeAiStatusResponse(raw: unknown): AiStatusResponse {
  const r = raw as RawAiStatusResponse
  const rawLevel = r.readinessLevel ?? ''
  // Defensive: unknown readiness level falls back to 'ready' so the page is never blanked
  // (Epic 108 spec mandates 'ready' as the safe fallback — 'collecting' would hide content).
  const readinessLevel = isReadinessLevel(rawLevel) ? rawLevel : 'ready'

  // Defensive: backend does not include weeksRequired in its response contract
  // (see docs/request-backend/174-ai-status-weeks-required-missing.md).
  // Preserve null so the UI can render defensively (no "X из 0" nonsense).
  const weeksRequired = r.weeksRequired != null ? r.weeksRequired : null
  if (weeksRequired === null) {
    // Surface missing contract field in DevTools so the backend gap is visible.
    // eslint-disable-next-line no-console
    console.warn('[ai/status] weeksRequired absent from backend response', r)
  }

  return {
    readinessLevel,
    weeksCollected: toCount(r.weeksCollected),
    weeksRequired,
    progressPct: toNullableNumber(r.progressPct),
    missingRequirements: r.missingRequirements ?? [],
    estimatedActivationDate: r.estimatedActivationDate ?? null,
    cogsCoveragePct: toNullableNumber(r.cogsCoveragePct),
    skuCount: toCount(r.skuCount),
    orderCount: toCount(r.orderCount),
  }
}
