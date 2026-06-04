/**
 * AI Evaluation + SKU Accuracy types — frontend-canonical shapes
 * Endpoints: GET /v1/ai/evaluations, GET /v1/ai/evaluations/sku-accuracy
 * Source: docs/AI-FRONTEND-INTEGRATION-GUIDE.md § Forecast Accuracy (Evaluations)
 */

export interface EvaluationEntry {
  forecastId: string
  /** Model ID that produced this forecast — always present per backend ship (Story 110.2-FE F-1) */
  modelId: string
  /** null for cabinet-level evaluations */
  nmId: number | null
  /** ISO date of the forecast horizon start — always present */
  forecastDate: string
  /** Number of days in the forecast horizon */
  horizonDays: number
  /** Predicted units sold — count, semantic-zero OK */
  predictedUnits: number
  /** Actual units sold — count, semantic-zero OK */
  actualUnits: number
  /** Predicted revenue (RUB) — null for unit-target models (Epic 113 I1); AP#8: never ?? 0 in money context */
  predictedRevenue: number | null
  /** Actual revenue — semantic-zero OK for fact */
  actualRevenue: number
  /** Mean Absolute Percentage Error for units — null when not yet evaluated */
  mapeUnits: number | null
  /** Mean Absolute Percentage Error for revenue — null when not yet evaluated */
  mapeRevenue: number | null
  /** ISO date when this entry was evaluated */
  evaluationDate: string
}

export interface AiEvaluationListResponse {
  evaluations: EvaluationEntry[]
  /** Aggregate cabinet-level MAPE — null when not yet evaluated */
  cabinetMape: number | null
  /** ISO datetime of last evaluation run — null when never evaluated */
  evaluatedAt: string | null
  /** Number of unique SKUs evaluated — count, semantic-zero OK */
  skuCount: number
}

export interface SkuAccuracyHistoryEntry {
  evaluationDate: string
  /** Predicted units — count, semantic-zero OK */
  predictedUnits: number
  /** Actual units — count, semantic-zero OK */
  actualUnits: number
  /**
   * Naive baseline predicted units — AP#8: units field, null preserved when not available.
   * Distinct from naiveMape (which is a percentage). Backend field: naiveBaseline (test-api/99-ai.http:91).
   * UI rendering deferred (3rd-pass F-1 post-close fix).
   */
  naiveBaseline: number | null
  /** AI MAPE for this period — null when not yet evaluated */
  mapeUnits: number | null
  /** Naive baseline MAPE for comparison — null when not available */
  naiveMape: number | null
}

export interface SkuAccuracyEntry {
  /** Null when backend row has no nmId (filtered out of list response; should not reach UI) */
  nmId: number | null
  vendorCode: string | null
  history: SkuAccuracyHistoryEntry[]
  /** Average AI MAPE across all evaluations — null when no evaluations yet */
  avgAiMape: number | null
  /** Average naive MAPE across all evaluations — null when no evaluations yet */
  avgNaiveMape: number | null
  /**
   * AI accuracy percentage vs naive baseline — null when not calculable.
   * Positive = AI beats naive; negative = AI worse than naive.
   */
  aiAccuracyPercent: number | null
  /**
   * Naive baseline accuracy percentage — null when not calculable.
   * Backend field: naiveAccuracyPercent (test-api/99-ai.http:77, Story 110.3-FE Task 2).
   */
  naiveAccuracyPercent: number | null
  /**
   * Total evaluation count for this SKU — count field, semantic-zero OK.
   * Backend field: evaluationCount (test-api/99-ai.http:77, Story 110.3-FE Task 2).
   */
  evaluationCount: number
}

export interface SkuAccuracyListResponse {
  skuAccuracies: SkuAccuracyEntry[]
}
