/**
 * AI Model Management API — fetchers
 * Endpoints: GET /v1/ai/models, POST /v1/ai/models/train,
 *            GET /v1/ai/models/:id/performance
 * Story 108.1-FE
 */

import { apiClient } from '../../api-client'
import {
  normalizeAiModelListResponse,
  normalizeModelPerformanceResponse,
  RawAiModel,
} from './ai-models-normalizer'
import type { ModelTrainRequest, ModelTrainResponse } from '@/types/ai/models'
import type { AiModelListResponse, ModelPerformanceResponse } from '@/types/ai/models'
import type { ModelType } from '@/types/ai/forecast'

// Re-export normalizers + shared Raw type for admin.ts
export { normalizeAiModelListResponse, normalizeModelPerformanceResponse }
export type { RawAiModel }

export async function getAiModels(): Promise<AiModelListResponse> {
  const raw = await apiClient.get<unknown>('/v1/ai/models')
  return normalizeAiModelListResponse(raw)
}

export async function postModelTrain(body: ModelTrainRequest): Promise<ModelTrainResponse> {
  const raw = await apiClient.post<{ status: string; modelType: string; message?: string }>(
    '/v1/ai/models/train',
    body
  )
  return {
    status: (raw.status ?? 'queued') as ModelTrainResponse['status'],
    modelType: (raw.modelType ?? body.modelType) as ModelType,
    message: raw.message,
  }
}

export async function getModelPerformance(id: string): Promise<ModelPerformanceResponse> {
  const raw = await apiClient.get<unknown>(`/v1/ai/models/${id}/performance`)
  return normalizeModelPerformanceResponse(raw)
}
