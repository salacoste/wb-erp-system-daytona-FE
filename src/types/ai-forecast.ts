/**
 * AI Forecast types — backward-compatible re-export barrel.
 * Story 108.1-FE: Types moved to src/types/ai/ subdirectory.
 * Existing consumers (Epic 103/104 hooks + components) continue to import from here.
 */

export type {
  ForecastLevel,
  AiForecastParams,
  AiForecastPrediction,
  RollbackNotice,
  AiForecastResponse,
  ConfidenceBand,
  ModelType,
} from './ai/forecast'

export {
  FORECAST_LEVELS,
  isForecastLevel,
  getConfidenceBand,
  MODEL_TYPES,
  isModelType,
} from './ai/forecast'
