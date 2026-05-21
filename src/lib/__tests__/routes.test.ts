/**
 * Unit tests for route helper functions in src/lib/routes.ts
 *
 * Story 110.1-FE: Pre-registered Epic 110 route helpers.
 * Tests follow the function-style helper convention (buildXxxRoute).
 */

import { describe, it, expect } from 'vitest'
import { buildModelEvaluationsRoute, buildModelSkuAccuracyRoute, ROUTES } from '../routes'

describe('buildModelEvaluationsRoute', () => {
  it('returns correct evaluations URL for a given model id', () => {
    expect(buildModelEvaluationsRoute('model-1')).toBe('/analytics/models/model-1/evaluations')
  })

  it('handles alphanumeric ids', () => {
    expect(buildModelEvaluationsRoute('abc-123')).toBe('/analytics/models/abc-123/evaluations')
  })

  it('preserves special characters in id (no encoding)', () => {
    expect(buildModelEvaluationsRoute('model_v2.0')).toBe(
      '/analytics/models/model_v2.0/evaluations'
    )
  })
})

describe('buildModelSkuAccuracyRoute', () => {
  it('returns correct sku-accuracy URL for a given model id', () => {
    expect(buildModelSkuAccuracyRoute('model-1')).toBe(
      '/analytics/models/model-1/evaluations/sku-accuracy'
    )
  })

  it('handles alphanumeric ids', () => {
    expect(buildModelSkuAccuracyRoute('abc-123')).toBe(
      '/analytics/models/abc-123/evaluations/sku-accuracy'
    )
  })

  it('preserves special characters in id (no encoding)', () => {
    expect(buildModelSkuAccuracyRoute('model_v2.0')).toBe(
      '/analytics/models/model_v2.0/evaluations/sku-accuracy'
    )
  })
})

describe('ROUTES.ANALYTICS.AI_ADMIN (Story 112.1-FE + 112.2-FE + 112.3-FE)', () => {
  it('MODELS constant has correct path', () => {
    expect(ROUTES.ANALYTICS.AI_ADMIN.MODELS).toBe('/analytics/ai-admin/models')
  })

  it('PREFERENCES constant has correct path (Story 112.2-FE)', () => {
    expect(ROUTES.ANALYTICS.AI_ADMIN.PREFERENCES).toBe('/analytics/ai-admin/preferences')
  })

  it('ANOMALIES constant has correct path (Story 112.3-FE)', () => {
    expect(ROUTES.ANALYTICS.AI_ADMIN.ANOMALIES).toBe('/analytics/ai-admin/anomalies')
  })
})
