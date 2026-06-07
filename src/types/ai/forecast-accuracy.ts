/**
 * Forecast Accuracy Types — GET /v1/ai/forecast-accuracy
 * Epic 123-FE: Accuracy summary with breakdowns by horizon and SKU.
 */

/** Aggregate accuracy metric for a specific forecast horizon. */
export interface HorizonAccuracy {
  horizonDays: number
  mape: number | null
  mae: number | null
  count: number
}

/** Per-SKU accuracy metric. */
export interface SkuAccuracy {
  nmId: number
  mape: number | null
  mae: number | null
  count: number
}

/** Full response from GET /v1/ai/forecast-accuracy. */
export interface ForecastAccuracyResponse {
  totalValidated: number
  avgMAPE: number | null
  avgMAE: number | null
  avgBias: number | null
  byHorizon: HorizonAccuracy[]
  bySKU: SkuAccuracy[]
}
