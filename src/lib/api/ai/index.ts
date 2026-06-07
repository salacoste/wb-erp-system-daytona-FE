/**
 * AI API — Barrel Re-export
 * Story 108.1-FE: Full 16-endpoint coverage across 5 functional areas.
 *
 * Import from '@/lib/api/ai' for all AI-related fetchers + normalizers.
 * Existing consumers of '@/lib/api/ai-forecast-api' continue to work via that file's re-exports.
 */

// Forecast (GET /v1/ai/forecast)
export { normalizeAiForecastResponse, getAiForecast } from './forecast'

// Status (GET /v1/ai/status)
export { normalizeAiStatusResponse, getAiStatus } from './status'

// Trends + Sneak Preview (GET /v1/ai/trends, GET /v1/ai/sneak-preview)
export {
  normalizeAiTrendsResponse,
  getAiTrends,
  normalizeAiSneakPreviewResponse,
  getAiSneakPreview,
} from './trends-sneak'

// Models (GET /v1/ai/models, POST /v1/ai/models/train, GET /v1/ai/models/:id/performance)
export {
  normalizeAiModelListResponse,
  getAiModels,
  postModelTrain,
  normalizeModelPerformanceResponse,
  getModelPerformance,
} from './models'

// Evaluations (GET /v1/ai/evaluations, GET /v1/ai/evaluations/sku-accuracy)
export {
  normalizeAiEvaluationListResponse,
  getEvaluations,
  normalizeSkuAccuracyListResponse,
  getSkuAccuracy,
} from './evaluations'
export type { EvaluationParams } from './evaluations'

// System (GET /v1/ai/health, GET|PATCH /v1/ai/preferences, POST /v1/ai/feedback,
//         PATCH /v1/ai/anomalies/:id/resolve, GET /v1/ai/anomalies [stub #167])
export {
  normalizeAiHealthResponse,
  getAiHealth,
  normalizeAiPreferences,
  getAiPreferences,
  patchAiPreferences,
  postFeedback,
  patchAnomalyResolve,
  getAnomalies,
} from './system'
export type { GetAnomaliesParams } from './system'

// Admin (GET /v1/ai/admin/models, PATCH /v1/ai/admin/models/:id/rollback)
export { normalizeAdminModelListResponse, getAdminModels, patchModelRollback } from './admin'

// Forecast Accuracy (GET /v1/ai/forecast-accuracy)
export { normalizeForecastAccuracyResponse, getForecastAccuracy } from './forecast-accuracy'
