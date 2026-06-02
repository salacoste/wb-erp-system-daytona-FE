/**
 * admin-models-helpers — Validation F-40.
 * The admin endpoint returns 10 model types (incl. anomaly_detection, return_prediction)
 * as raw snake_case; getModelTypeLabel localizes them and falls back to the raw value.
 */

import { describe, it, expect } from 'vitest'
import { getModelTypeLabel, ADMIN_MODEL_TYPE_LABELS } from '../admin-models-helpers'
import { MODEL_TYPE_LABELS } from '@/types/ai/forecast'

describe('getModelTypeLabel — F-40', () => {
  it('localizes every model type the live admin endpoint returns', () => {
    const live = [
      'anomaly_detection',
      'anomaly_detection_daily',
      'daily_revenue_forecast',
      'funnel_stage_prediction',
      'return_prediction',
      'return_prediction_daily',
      'sales_forecast',
      'sales_forecast_daily',
      'search_conversion_forecast',
      'weekly_margin_forecast',
    ]
    for (const t of live) {
      expect(ADMIN_MODEL_TYPE_LABELS[t]).toBeTruthy()
      expect(getModelTypeLabel(t)).toBe(ADMIN_MODEL_TYPE_LABELS[t])
      // a localized label must not be the raw snake_case value
      expect(getModelTypeLabel(t)).not.toBe(t)
    }
  })

  it('keeps shared forecast types in sync with the canonical MODEL_TYPE_LABELS (no drift)', () => {
    // Same model type must show the SAME Russian label on the public models page and here.
    for (const key of Object.keys(MODEL_TYPE_LABELS)) {
      expect(getModelTypeLabel(key)).toBe(MODEL_TYPE_LABELS[key as keyof typeof MODEL_TYPE_LABELS])
    }
  })

  it('falls back to the raw value for an unknown/future model type (never blank)', () => {
    expect(getModelTypeLabel('some_future_type')).toBe('some_future_type')
    expect(getModelTypeLabel('')).toBe('')
  })
})
