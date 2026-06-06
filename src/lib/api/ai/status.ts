/**
 * AI Status API — fetcher
 * Endpoint: GET /v1/ai/status
 * Story 108.1-FE: Readiness state machine for 3-state UI routing.
 */

import { apiClient } from '../../api-client'
import { normalizeAiStatusResponse } from './ai-status-normalizer'
import type { AiStatusResponse } from '@/types/ai/status'

export { normalizeAiStatusResponse } from './ai-status-normalizer'

export async function getAiStatus(): Promise<AiStatusResponse> {
  const raw = await apiClient.get<unknown>('/v1/ai/status')
  return normalizeAiStatusResponse(raw)
}
