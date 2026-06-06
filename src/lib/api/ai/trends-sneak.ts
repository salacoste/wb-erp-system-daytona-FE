/**
 * AI Trends + Sneak Preview API — fetchers
 * Endpoints: GET /v1/ai/trends, GET /v1/ai/sneak-preview
 * Story 108.1-FE
 */

import { apiClient } from '../../api-client'
import { normalizeAiTrendsResponse, normalizeAiSneakPreviewResponse } from './ai-trends-normalizer'
import type { AiTrendsResponse, AiSneakPreviewResponse } from '@/types/ai/trends-sneak'

export { normalizeAiTrendsResponse, normalizeAiSneakPreviewResponse } from './ai-trends-normalizer'

export async function getAiTrends(): Promise<AiTrendsResponse> {
  const raw = await apiClient.get<unknown>('/v1/ai/trends')
  return normalizeAiTrendsResponse(raw)
}

export async function getAiSneakPreview(): Promise<AiSneakPreviewResponse> {
  const raw = await apiClient.get<unknown>('/v1/ai/sneak-preview')
  return normalizeAiSneakPreviewResponse(raw)
}
