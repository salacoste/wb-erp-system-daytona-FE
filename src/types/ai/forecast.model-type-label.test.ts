/**
 * getModelTypeLabel — model-type display label resolution (iter-64)
 *
 * The /analytics/models admin views receive management model types (return_prediction,
 * anomaly_detection, *_daily) that the forecast ModelType union does NOT cover. The prior
 * `MODEL_TYPE_LABELS[modelType]` indexing rendered `undefined` for 7/15 live rows. These tests pin
 * the 3-tier resolution: union label → management label → humanized fallback (never blank).
 */
import { describe, it, expect } from 'vitest'
import { getModelTypeLabel, MODEL_TYPES } from './forecast'

describe('getModelTypeLabel', () => {
  it('returns the Russian label for forecast-selectable union types', () => {
    expect(getModelTypeLabel('sales_forecast')).toBe('Прогноз продаж')
    expect(getModelTypeLabel('daily_revenue_forecast')).toBe('Прогноз выручки (день)')
  })

  it('every forecast-selectable MODEL_TYPES entry resolves to a non-blank label', () => {
    for (const t of MODEL_TYPES) {
      const label = getModelTypeLabel(t)
      expect(label).toBeTruthy()
      expect(label).not.toBe(t) // must be a translated label, not the raw key
    }
  })

  it('labels the backend management types not in the forecast union', () => {
    expect(getModelTypeLabel('return_prediction')).toBe('Прогноз возвратов')
    expect(getModelTypeLabel('return_prediction_daily')).toBe('Прогноз возвратов (день)')
    expect(getModelTypeLabel('anomaly_detection')).toBe('Детекция аномалий')
    expect(getModelTypeLabel('anomaly_detection_daily')).toBe('Детекция аномалий (день)')
    expect(getModelTypeLabel('sales_forecast_daily')).toBe('Прогноз продаж (день)')
  })

  it('falls back to the RAW backend value for a genuinely unknown type (never undefined)', () => {
    // Future/unknown backend type: render the honest raw value, NOT undefined. (Matches the
    // established Story 112.1-FE admin contract — both model tables share this canonical fn.)
    expect(getModelTypeLabel('some_future_model')).toBe('some_future_model')
    expect(getModelTypeLabel('totally_new_type_v2')).toBe('totally_new_type_v2')
  })

  it('does NOT pollute the forecast selector list with management types', () => {
    // MODEL_TYPES drives ModelTypeSelector; management types must stay out of it.
    expect(MODEL_TYPES).not.toContain('return_prediction')
    expect(MODEL_TYPES).not.toContain('anomaly_detection')
    expect(MODEL_TYPES).not.toContain('sales_forecast_daily')
  })
})
